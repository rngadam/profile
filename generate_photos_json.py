import os
import json
from datetime import datetime
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS

def get_exif_data(image):
    exif_data = {}
    info = image._getexif()
    if not info:
        return exif_data
    for tag, value in info.items():
        decoded = TAGS.get(tag, tag)
        if decoded == "GPSInfo":
            gps_data = {}
            for t in value:
                sub_decoded = GPSTAGS.get(t, t)
                gps_data[sub_decoded] = value[t]
            exif_data[decoded] = gps_data
        else:
            exif_data[decoded] = value
    return exif_data

def get_decimal_from_dms(dms, ref):
    degrees = dms[0][0] / dms[0][1]
    minutes = dms[1][0] / dms[1][1]
    seconds = dms[2][0] / dms[2][1]
    decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
    if ref in ['S', 'W']:
        decimal = -decimal
    return decimal

def extract_gps_info(exif_data):
    gps_info = exif_data.get("GPSInfo", {})
    if not gps_info:
        return None, None
    lat = gps_info.get("GPSLatitude")
    lat_ref = gps_info.get("GPSLatitudeRef")
    lon = gps_info.get("GPSLongitude")
    lon_ref = gps_info.get("GPSLongitudeRef")
    if lat and lat_ref and lon and lon_ref:
        latitude = get_decimal_from_dms(lat, lat_ref)
        longitude = get_decimal_from_dms(lon, lon_ref)
        return latitude, longitude
    return None, None

def extract_created_time(exif_data):
    date_str = exif_data.get("DateTimeOriginal") or exif_data.get("DateTime")
    if date_str:
        try:
            return datetime.strptime(date_str, "%Y:%m:%d %H:%M:%S").isoformat()
        except Exception:
            return date_str
    return None

photos_dir = "photos"
photos_data = []

for filename in os.listdir(photos_dir):
    if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        filepath = os.path.join(photos_dir, filename)
        try:
            with Image.open(filepath) as img:
                exif_data = get_exif_data(img)
                lat, lon = extract_gps_info(exif_data)
                created = extract_created_time(exif_data)
                photo_info = {
                    "filename": filename,
                    "latitude": lat,
                    "longitude": lon,
                    "created": created
                }
                photos_data.append(photo_info)
        except Exception:
            continue

with open("photos.json", "w", encoding="utf-8") as f:
    json.dump(photos_data, f, indent=2, ensure_ascii=False)