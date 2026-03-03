import cv2
import numpy as np
import os

files = ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg']
names = ['lucario', 'mimikyu', 'lapras', 'sirfetchd', 'duraludon']

os.chdir('qr_images')

for f, name in zip(files, names):
    img = cv2.imread(f)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # The QR is pure black and white. Threshold to get black pixels.
    _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
    
    # We only care about the top 2/3rds of the image where the QR code is
    h, w = thresh.shape
    thresh[int(h*0.7):, :] = 0
    thresh[:int(h*0.2), :] = 0
    
    coords = cv2.findNonZero(thresh)
    x, y, w_box, h_box = cv2.boundingRect(coords)
    
    # Add a small padding
    pad = 10
    x = max(0, x - pad)
    y = max(0, y - pad)
    w_box = min(w - x, w_box + 2*pad)
    h_box = min(h - y, h_box + 2*pad)
    
    # Crop the original image
    qr_crop = img[y:y+h_box, x:x+w_box]
    
    cv2.imwrite(f"{name}_qr.png", qr_crop)
    print(f"Cropped {name} size {w_box}x{h_box}")
