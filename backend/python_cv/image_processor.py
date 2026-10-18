import sys
import cv2
import numpy as np

def analyze_image(input_path, output_path):
    img = cv2.imread(input_path)
    if img is None:
        print("An unknown object")
        return

    output_img = img.copy()

    # --- PREPROCESSING & SEGMENTATION ---
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    edges = cv2.Canny(blurred, 30, 150)
    kernel = np.ones((9,9), np.uint8)
    dilated = cv2.dilate(edges, kernel, iterations=2)
    
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        print("An unknown object")
        return

    # Find the largest object in the image
    largest_contour = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest_contour)
    
    # Draw the bounding box
    cv2.rectangle(output_img, (x, y), (x+w, y+h), (0, 255, 0), 3)

    # --- EXTRACT MATHEMATICAL FEATURES ---
    aspect_ratio = float(w) / h
    
    rect_area = w * h
    contour_area = cv2.contourArea(largest_contour)
    solidity = float(contour_area) / rect_area if rect_area > 0 else 0
    
    approx = cv2.approxPolyDP(largest_contour, 0.03 * cv2.arcLength(largest_contour, True), True)
    corners = len(approx)

    cx, cy = x + w//2, y + h//2
    sample_size = 20
    roi_center = gray[max(0, cy-sample_size):cy+sample_size, max(0, cx-sample_size):cx+sample_size]
    texture_score = cv2.Laplacian(roi_center, cv2.CV_64F).var() if roi_center.size > 0 else 0

    # --- THE SMART CLASSIFIER ---
    
    # Rule 1: KEYS (Irregular shape, lots of corners, low fill area)
    if corners > 6 and solidity < 0.6:
        item_guess = "Keys or Keychain"
        reason = "highly irregular shape with empty gaps"

    # Rule 2: SMART PHONE (Tall rectangle)
    elif corners in [4, 5] and 0.4 <= aspect_ratio <= 0.8:
        item_guess = "Smartphone"
        reason = "tall rectangular shape"

    # Rule 3: ID CARD (Wide rectangle, smooth surface)
    elif corners in [4, 5] and 1.3 <= aspect_ratio <= 1.8 and texture_score < 150:
        item_guess = "ID Card or Driver's License"
        reason = "flat card proportions with a smooth surface"

    # Rule 4: WALLET (Wide rectangle, textured surface)
    elif corners in [4, 5] and 0.8 <= aspect_ratio <= 1.4 and texture_score >= 150:
        item_guess = "Wallet"
        reason = "rectangular with a textured surface"

    # Rule 5: BOOK (Very wide, thick)
    elif aspect_ratio > 1.4:
        item_guess = "Book or Notebook"
        reason = "wide and thick shape"
        
    else:
        item_guess = "Bag or Unknown Object"
        reason = "complex shape"

    # Construct final description
    description = f"{item_guess} (Detected: {reason})"
    
    # Draw text on image
    cv2.putText(output_img, item_guess, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    # --- WE REMOVED THE AUTO-CROP HERE ---
    # Now it will save the whole image with the green box on it.
    cv2.imwrite(output_path, output_img)
    print(description)

if __name__ == "__main__":
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    analyze_image(input_file, output_file)