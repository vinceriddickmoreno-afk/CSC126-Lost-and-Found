# CSU Lost & Found with OpenCV Image Processing

## Project Description
This project is a full-stack web application for reporting and claiming lost items on campus. It integrates a Python Computer Vision microservice that automatically analyzes uploaded images, draws bounding boxes around the detected item, and provides an AI-generated guess of what the object is.

## OpenCV Techniques Used
1. **Image Operations:** Grayscale conversion, Gaussian Blurring, and Canny Edge Detection to clean the image.
2. **Image Segmentation:** Contour finding and Dilation to isolate the main object from the background.
3. **Image Analysis:** Polygon approximation, Aspect Ratio, and Texture Variance (Laplacian) to classify the object (e.g., Wallet, Phone, ID Card).

## Setup Instructions

### 1. Backend (Node.js & Express)
```bash
cd backend
npm install
npm run dev