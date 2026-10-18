# ============================================================
# LOST & FOUND - SECURITY AUDIT SCRIPT
# ============================================================

$BASE = "http://localhost:5000/api"
$script:pass = 0
$script:fail = 0
$script:warn = 0

function Test-Result($name, $expected, $actual, $notes = "") {
    if ($actual -eq $expected) {
        Write-Host "  [PASS] $name" -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host "  [FAIL] $name (expected $expected, got $actual)" -ForegroundColor Red
        if ($notes) { Write-Host "         $notes" -ForegroundColor DarkYellow }
        $script:fail++
    }
}

function Test-Warn($name, $notes) {
    Write-Host "  [WARN] $name" -ForegroundColor Yellow
    Write-Host "         $notes" -ForegroundColor DarkYellow
    $script:warn++
}

function Section($title) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
}

# Test 1: SQL Injection
Section "1. SQL INJECTION TEST"

$sql1 = '{"email":"'' OR ''1''=''1","password":"anything"}'
try {
    $r = Invoke-WebRequest -Uri "$BASE/auth/login" -Method POST -Body $sql1 -ContentType "application/json" -ErrorAction Stop
    Test-Result "SQL injection blocked in login" 401 $r.StatusCode
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 401 -or $code -eq 400) {
        Test-Result "SQL injection blocked in login" $code $code
    } else {
        Test-Result "SQL injection blocked in login" 401 $code
    }
}

$sql2 = '{"email":"admin@csu.edu.ph'' UNION SELECT * FROM users--","password":"x"}'
try {
    $r = Invoke-WebRequest -Uri "$BASE/auth/login" -Method POST -Body $sql2 -ContentType "application/json" -ErrorAction Stop
    Test-Result "UNION injection blocked" 401 $r.StatusCode
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Test-Result "UNION injection blocked" 401 $code
}

try {
    $r = Invoke-WebRequest -Uri "$BASE/items?search=test" -Method GET -ErrorAction Stop
    Test-Result "Search endpoint responds" 200 $r.StatusCode
} catch {
    Test-Warn "Search endpoint" "Returned: $($_.Exception.Message)"
}

# Test 2: Register test user
Section "2. REGISTER TEST USER"

$unique = [System.Guid]::NewGuid().ToString().Substring(0,8)
$testUser = '{"name":"SecTest' + $unique + '","email":"sectest' + $unique + '@test.com","password":"TestPass123"}'
$token = $null

try {
    $reg = Invoke-RestMethod -Uri "$BASE/auth/register" -Method POST -Body $testUser -ContentType "application/json"
    $token = $reg.accessToken
    Write-Host "  [INFO] Test user created successfully" -ForegroundColor DarkCyan
    Write-Host "  [INFO] Token obtained: $($token.Substring(0,20))..." -ForegroundColor DarkCyan
} catch {
    Write-Host "  [INFO] Could not register: $($_.Exception.Message)" -ForegroundColor DarkCyan
}

# Test 3: JWT Tampering
Section "3. JWT TOKEN TAMPERING"

if ($token) {
    $parts = $token.Split('.')
    if ($parts.Length -eq 3) {
        Write-Host "  [INFO] Token has 3 parts (header.payload.signature) - valid JWT" -ForegroundColor DarkCyan

        $fakePayload = '{"id":1,"email":"admin@csu.edu.ph","role":"admin","iat":1700000000}'
        $fakeB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($fakePayload)).Replace('+','-').Replace('/','_').TrimEnd('=')
        $fakeToken = "$($parts[0]).$fakeB64.fakesignature"

        try {
            $r = Invoke-WebRequest -Uri "$BASE/admin/stats" -Method GET -Headers @{ Authorization = "Bearer $fakeToken" } -ErrorAction Stop
            Test-Result "Forged JWT rejected" 401 $r.StatusCode "CRITICAL: forged token accepted!"
        } catch {
            $code = $_.Exception.Response.StatusCode.value__
            Test-Result "Forged JWT rejected" 401 $code
        }
    }
}

# Test 4: Authorization Bypass
Section "4. AUTHORIZATION BYPASS TEST"

if ($token) {
    try {
        $r = Invoke-WebRequest -Uri "$BASE/admin/stats" -Method GET -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
        Test-Result "Regular user blocked from admin/stats" 403 $r.StatusCode "CRITICAL: user accessed admin!"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -eq 403) {
            Test-Result "Regular user blocked from admin/stats" 403 403
        } else {
            Test-Result "Regular user blocked from admin/stats" 403 $code
        }
    }

    try {
        $r = Invoke-WebRequest -Uri "$BASE/admin/users" -Method GET -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
        Test-Result "Regular user blocked from admin/users" 403 $r.StatusCode
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Test-Result "Regular user blocked from admin/users" 403 $code
    }
}

# Test 5: Missing Auth
Section "5. MISSING AUTHENTICATION TEST"

try {
    $r = Invoke-WebRequest -Uri "$BASE/items" -Method POST -Body '{"title":"test"}' -ContentType "application/json" -ErrorAction Stop
    Test-Result "Unauthenticated create blocked" 401 $r.StatusCode "CRITICAL: anonymous can create items!"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Test-Result "Unauthenticated create blocked" 401 $code
}

try {
    $r = Invoke-WebRequest -Uri "$BASE/admin/stats" -Method GET -ErrorAction Stop
    Test-Result "Unauthenticated admin blocked" 401 $r.StatusCode
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Test-Result "Unauthenticated admin blocked" 401 $code
}

# Test 6: IDOR
Section "6. IDOR TEST (Delete other user's item)"

if ($token) {
    try {
        $r = Invoke-WebRequest -Uri "$BASE/items/1" -Method DELETE -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
        if ($r.StatusCode -eq 200) {
            Test-Result "Cannot delete other users items" $false $true "CRITICAL: you deleted someone elses item!"
        } else {
            Test-Result "Cannot delete other users items" 403 $r.StatusCode
        }
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Test-Result "Cannot delete other users items" 403 $code
    }
}

# Test 7: Rate Limiting
Section "7. RATE LIMITING (BRUTE FORCE)"

Write-Host "  Sending 15 login attempts with wrong password..." -ForegroundColor DarkCyan
$rateLimited = $false
$lastCode = 0

for ($i = 1; $i -le 15; $i++) {
    $bad = '{"email":"admin@csu.edu.ph","password":"wrong' + $i + '"}'
    try {
        $r = Invoke-WebRequest -Uri "$BASE/auth/login" -Method POST -Body $bad -ContentType "application/json" -ErrorAction Stop
        $lastCode = $r.StatusCode
    } catch {
        $lastCode = $_.Exception.Response.StatusCode.value__
        if ($lastCode -eq 429) {
            $rateLimited = $true
            Write-Host "  [INFO] Rate limit triggered at attempt #$i" -ForegroundColor DarkCyan
            break
        }
    }
    Start-Sleep -Milliseconds 100
}

Test-Result "Rate limiting on login" $true $rateLimited "Add express-rate-limit if failed"

# Test 8: Weak Password Policy
Section "8. PASSWORD POLICY TEST"

$weakPasswords = @("abc", "abcdefgh", "password", "12345678")

foreach ($weak in $weakPasswords) {
    $body = '{"name":"WeakTest' + $unique + '","email":"weak' + $unique + $weak.Length + '@test.com","password":"' + $weak + '"}'
    try {
        $r = Invoke-WebRequest -Uri "$BASE/auth/register" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
        Write-Host "  [WARN] Weak password accepted: $weak" -ForegroundColor Yellow
        $script:warn++
    } catch {
        Write-Host "  [PASS] Weak password rejected: $weak" -ForegroundColor Green
        $script:pass++
    }
}

# Test 9: CORS
Section "9. CORS POLICY TEST"

try {
    $r = Invoke-WebRequest -Uri "$BASE/items" -Method GET -Headers @{ "Origin" = "https://evil-hacker.com" } -ErrorAction Stop
    $corsHeader = $r.Headers["Access-Control-Allow-Origin"]
    if ($corsHeader -eq "*") {
        Test-Warn "CORS allows any origin" "Restrict ALLOWED_ORIGINS in .env"
    } elseif ($corsHeader -eq "https://evil-hacker.com") {
        Test-Result "CORS blocks evil origin" $false $true "CRITICAL: evil origin allowed!"
    } else {
        Test-Result "CORS blocks evil origin" $true $true
    }
} catch {
    Test-Warn "CORS test" "Request failed: $($_.Exception.Message)"
}

# Test 10: File Upload
Section "10. FILE UPLOAD SECURITY"

if ($token) {
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    $body = "--$boundary$LF"
    $body += "Content-Disposition: form-data; name=`"title`"$LF$LF"
    $body += "Malicious Upload$LF"
    $body += "--$boundary$LF"
    $body += "Content-Disposition: form-data; name=`"status`"$LF$LF"
    $body += "lost$LF"
    $body += "--$boundary$LF"
    $body += "Content-Disposition: form-data; name=`"image`"; filename=`"shell.php`"$LF"
    $body += "Content-Type: application/x-php$LF$LF"
    $body += "<?php echo 'hacked'; ?>$LF"
    $body += "--$boundary--$LF"

    try {
        $r = Invoke-WebRequest -Uri "$BASE/items" -Method POST -Body $body -ContentType "multipart/form-data; boundary=$boundary" -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
        Test-Result "PHP upload rejected" 400 $r.StatusCode "CRITICAL: PHP file accepted!"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -eq 400 -or $code -eq 413) {
            Test-Result "PHP upload rejected" $code $code
        } else {
            Test-Warn "File upload test" "Got status: $code"
        }
    }
}

# Test 11: Error Leakage
Section "11. ERROR MESSAGE LEAKAGE"

try {
    $r = Invoke-WebRequest -Uri "$BASE/items/999999999" -Method GET -ErrorAction Stop
} catch {
    $body = ""
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd()
        $reader.Close()
    } catch {}

    if ($body -match "at .*\.js:" -or $body -match "Cannot read property") {
        Test-Result "No stack trace leaked" $false $true "Server leaks error details"
    } else {
        Test-Result "No stack trace leaked" $true $true
    }
}

# Summary
Section "AUDIT COMPLETE"

Write-Host ""
Write-Host "  PASSED:   $script:pass" -ForegroundColor Green
Write-Host "  FAILED:   $script:fail" -ForegroundColor Red
Write-Host "  WARNINGS: $script:warn" -ForegroundColor Yellow
Write-Host ""

if ($script:fail -eq 0) {
    Write-Host "  All critical security tests passed!" -ForegroundColor Green
} else {
    Write-Host "  Fix the failed tests before demo." -ForegroundColor Red
}

if ($script:warn -gt 0) {
    Write-Host "  Review warnings for improvements." -ForegroundColor Yellow
}

Write-Host ""