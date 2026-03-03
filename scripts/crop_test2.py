import cv2
import numpy as np
import os

files = ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg', '9.jpg', '10.jpg']

os.chdir('qr_images')
for f in files:
    img = cv2.imread(f)
    if img is None: continue
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
    h, w = thresh.shape
    
    # Let's try 0.60
    thresh[int(h*0.60):, :] = 0
    thresh[:int(h*0.25), :] = 0
    
    coords = cv2.findNonZero(thresh)
    if coords is not None:
        x, y, w_box, h_box = cv2.boundingRect(coords)
        print(f"{f} (0.60): qr box at y={y}, h={h_box} -> bottom={y+h_box}")
    else:
        print(f"{f}: no box found")

for f in files:
    img = cv2.imread(f)
    if img is None: continue
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
    h, w = thresh.shape
    
    # 0.65 (what we have now)
    thresh[int(h*0.65):, :] = 0
    thresh[:int(h*0.25), :] = 0
    
    coords = cv2.findNonZero(thresh)
    if coords is not None:
        x, y, w_box, h_box = cv2.boundingRect(coords)
        print(f"{f} (0.65): qr box at y={y}, h={h_box} -> bottom={y+h_box}")
