import cv2
import numpy as np
import os

files = ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg']
names = ['lucario', 'mimikyu', 'lapras', 'sirfetchd', 'duraludon']

os.chdir('qr_images')

for f, name in zip(files, names):
    img = cv2.imread(f)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Threshold to find the black parts
    _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
    
    # Zero out the bottom half of the image to completely avoid the logo/text
    h, w = thresh.shape
    thresh[int(h*0.65):, :] = 0
    thresh[:int(h*0.25), :] = 0
    
    # Get all non-zero points
    coords = cv2.findNonZero(thresh)
    if coords is not None:
        x, y, w_box, h_box = cv2.boundingRect(coords)
        
        # Make the box a perfect square
        size = max(w_box, h_box)
        
        # Center the square on the original bounding box center
        cx = x + w_box // 2
        cy = y + h_box // 2
        
        x_new = cx - size // 2
        y_new = cy - size // 2
        
        # Add padding
        pad = 15
        x_new = max(0, x_new - pad)
        y_new = max(0, y_new - pad)
        size += 2*pad
        
        qr_crop = img[y_new:y_new+size, x_new:x_new+size]
        
        cv2.imwrite(f"{name}_qr.png", qr_crop)
        print(f"Cropped {name} perfectly! Size: {size}x{size}")
    else:
        print(f"Could not crop {name}")
