const Item = require('../models/Item');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

exports.getAllItems = async (req, res, next) => {
  try {
    const items = await Item.findAll();
    res.json({ items });
  } catch (err) { 
    next(err); 
  }
};

exports.createItem = async (req, res, next) => {
  try {
    let { title, description, location, category, status } = req.body;
    let image_url = null;

    if (req.file) {
      const rawImagePath = req.file.path; 
      const processedFilename = `processed-${req.file.filename}`;
      const processedImagePath = path.join(__dirname, '..', 'uploads', processedFilename);
      
      const pythonScript = path.join(__dirname, '..', 'python_cv', 'image_processor.py');
      const pythonExecutable = path.join(__dirname, '..', '..', '.venv', 'Scripts', 'python.exe');

      console.log("🤖 Running Python CV Analysis...");

      // We capture the output from Python here
      const cvDescription = await new Promise((resolve) => {
        exec(`"${pythonExecutable}" "${pythonScript}" "${rawImagePath}" "${processedImagePath}"`, (error, stdout, stderr) => {
          if (error) {
            console.error(`Python Error: ${error.message}`);
            resolve(null); 
          } else {
            // Remove any trailing newlines from the python output
            resolve(stdout.trim()); 
          }
        });
      });

      if (fs.existsSync(processedImagePath)) {
        image_url = `/uploads/${processedFilename}`;
        fs.unlinkSync(rawImagePath); 
      } else {
        image_url = `/uploads/${req.file.filename}`; 
      }

      // IF the user didn't type a description, use the AI's description!
      if (!description || description.trim() === '') {
        description = cvDescription 
          ? `System Detected: ${cvDescription}` 
          : "An item was uploaded.";
      } else {
        // If they typed one, append the AI's description
        description = `${description} (System Detected: ${cvDescription})`;
      }
    }
    
    const item = await Item.create({ 
      user_id: req.user.id, title, description, location, category, status, image_url 
    });
    
    res.status(201).json({ message: 'Item created and image analyzed', item });
  } catch (err) { 
    next(err); 
  }
};

exports.deleteItem = async (req, res, next) => {
  try {
    const itemId = req.params.id;
    const userId = req.user.id;
    const db = require('../config/db');
    
    const [items] = await db.getPool().query('SELECT * FROM items WHERE id = ?', [itemId]);
    const item = items[0];
    
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own items' });
    }
    
    await db.getPool().query('DELETE FROM items WHERE id = ?', [itemId]);
    res.json({ message: 'Item deleted' });
  } catch (err) { 
    next(err); 
  }
};