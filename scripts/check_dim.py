import cv2
import os

os.chdir('qr_images')
for f in ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg', '9.jpg', '10.jpg']:
    if os.path.exists(f):
        img = cv2.imread(f)
        if img is not None:
            print(f"{f}: {img.shape}")
