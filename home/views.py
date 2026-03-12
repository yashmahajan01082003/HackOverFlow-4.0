import os
import subprocess
import threading
import time
import webbrowser
from cvzone.HandTrackingModule import HandDetector
import numpy as np
from PIL import ImageGrab
from django.conf import settings
from django.http import HttpResponse, request
from django.shortcuts import render
from pathlib import Path
from .models import IconsForDesktop, BottomSideIcons, HandGest
import psutil
import cv2
import pyautogui
import mediapipe as mp

def index(request):
    Icons = IconsForDesktop.objects.all()
    BIcons = BottomSideIcons.objects.all()
    battery = psutil.sensors_battery()
    plugged = battery.power_plugged
    percent = battery.percent

    if plugged:
        status = "Plugged in"
    else:
        status = "Not plugged in"

    desktop_path = os.path.expanduser("~/Desktop")
    folders = [name for name in os.listdir(desktop_path) if os.path.isdir(os.path.join(desktop_path, name))]

    context={
        'Icon' : Icons,
        'folders' : folders,
        'BIcons' : BIcons,
        'perc' : percent,
        'status' : status,
        'deskp': desktop_path,
    }
    return render(request,'home/templates/index.html',context)

def openDesktopD(request,fName):
    # Get the path to the desktop
    desktop_path = Path.home() / 'Desktop'

    # Construct the path to the fName directory on the desktop
    fName_path = desktop_path / fName

    # List directories within the fName directory
    directories = [directory for directory in os.listdir(fName_path) if os.path.isdir(fName_path / directory)]

    # Print the list of directories
    for directory in directories:
        print(directory)

    folders = directories

    context={
        'folders':folders,
        'root' : 'Desktop',
        'parent1' : fName,
    }
    return render(request,'home/templates/desktopfolderinternal.html',context)

def BSIcons(request,fName):
    Bicons = BottomSideIcons.objects.all()
    if fName == Bicons[0].name:
        webbrowser.open('www.google.com')

    if fName == Bicons[1].name:
        calculator_process = subprocess.Popen('calc.exe')

    if fName == Bicons[2].name:
        subprocess.Popen('explorer')

    if fName == Bicons[3].name:
        camera_app_url = 'microsoft.windows.camera:'  # Windows Camera app URL
        webbrowser.open(camera_app_url)

    if fName == Bicons[4].name:
        subprocess.Popen('cmd.exe', creationflags=subprocess.CREATE_NEW_CONSOLE)

    if fName == Bicons[5].name:
        os.startfile("outlookcal:")

    if fName == Bicons[6].name:
        subprocess.Popen('explorer.exe ms-settings:')

    if fName == Bicons[7].name:
        subprocess.Popen(['notepad.exe'])

    if fName == Bicons[8].name:
        subprocess.Popen(['control'])

    Icons = IconsForDesktop.objects.all()
    BIcons = BottomSideIcons.objects.all()
    desktop_path = os.path.expanduser("~/Desktop")
    folders = [name for name in os.listdir(desktop_path) if os.path.isdir(os.path.join(desktop_path, name))]

    Icons = IconsForDesktop.objects.all()
    BIcons = BottomSideIcons.objects.all()
    battery = psutil.sensors_battery()
    plugged = battery.power_plugged
    percent = battery.percent

    if plugged:
        status = "Plugged in"
    else:
        status = "Not plugged in"

    desktop_path = os.path.expanduser("~/Desktop")
    folders = [name for name in os.listdir(desktop_path) if os.path.isdir(os.path.join(desktop_path, name))]

    context = {
        'Icon': Icons,
        'folders': folders,
        'BIcons': BIcons,
        'perc': percent,
        'status': status,
        'deskp' : desktop_path,
    }

    return render(request, 'home/templates/index.html', context)



def openParti(request):
    partitions = psutil.disk_partitions(all=True)
    folders=[]
    for partition in partitions:
        drive_letter = partition.device
        folders.append(drive_letter)
        print(drive_letter)

    context={
        'folders': folders,
    }
    return render(request,'home/templates/partition.html',context)


def get_directories_in_drive(fName):
    c_drive_path = fName
    directories = [name for name in os.listdir(c_drive_path) if os.path.isdir(os.path.join(c_drive_path, name))]
    return directories


def openPartiSpec(request,fName):
    partitions = psutil.disk_partitions(all=True)
    folders=[]
    directory_list=[]
    for partition in partitions:
        drive_letter = partition.device
        folders.append(drive_letter)

    if fName == folders[0]:
        directory_list = get_directories_in_drive(fName)


    if fName == folders[1]:
        directory_list = get_directories_in_drive(fName)


    battery = psutil.sensors_battery()
    plugged = battery.power_plugged
    percent = battery.percent

    if plugged:
        status = "Plugged in"
    else:
        status = "Not plugged in"

    context={
        'folders': directory_list,
        'root' : fName,
        'perc': percent,
        'status': status,
    }
    return render(request,'home/templates/insidepart.html',context)


def openPartiSpec2(request, fName0, fName1):
    partitions = psutil.disk_partitions(all=True)
    folders = [partition.device for partition in partitions]
    fName0 = fName0.replace('/', '\\')  # Replace forward slash with backslash
    fName1 = fName1.replace('/', '\\') if fName1 else ''  # Replace forward slash with backslash if fName1 is not empty

    path = os.path.join(fName0, fName1)
    is_file = os.path.isfile(path)

    if is_file:
        # Handle file case
        webbrowser.open(path)
        path1 = os.path.join(fName0)
        directory_list = []
        file_list = []
        if os.path.exists(path1):
            for item in os.listdir(path1):
                item_path = os.path.join(path1, item)
                if os.path.isdir(item_path):
                    directory_list.append(item)
                else:
                    file_list.append(item)

        root = os.path.join(fName0)

        context = {
            'folders': directory_list,
            'files': file_list,
            'root': root,
            'parent1': fName1,
        }
        return render(request, 'home/templates/insidepart.html', context)

    directory_list = []
    file_list = []
    if os.path.exists(path):
        for item in os.listdir(path):
            item_path = os.path.join(path, item)
            if os.path.isdir(item_path):
                directory_list.append(item)
            else:
                file_list.append(item)

    root = os.path.join(fName0, fName1)

    battery = psutil.sensors_battery()
    plugged = battery.power_plugged
    percent = battery.percent

    if plugged:
        status = "Plugged in"
    else:
        status = "Not plugged in"

    context = {
        'folders': directory_list,
        'files': file_list,
        'root': root,
        'parent1': fName1,
        'perc' : percent,
        'status' : status,
    }
    return render(request, 'home/templates/insidepart.html', context)

def newD(request):
    desktop_path = os.path.join(os.path.expanduser("~"), "Desktop")
    fName = request.GET.get('name')
    flag = request.GET.get('flag')
    new_directory = os.path.join(desktop_path, fName)
    print(flag)
    # Create the directory if it doesn't exist
    if flag == '2':
        if not os.path.exists(new_directory):
            os.mkdir(new_directory)
            print("Directory created successfully.")
        else:
            print("Directory already exists.")

    if flag=='3':
        if not os.path.exists(new_directory):
            with open(new_directory, 'w') as file:
                file.write('')  # You can write content to the file if needed
            print("File created successfully.")
        else:
            print("File already exists.")

    if flag=='4':
        subprocess.call(["powershell.exe"])

    Icons = IconsForDesktop.objects.all()
    BIcons = BottomSideIcons.objects.all()
    battery = psutil.sensors_battery()
    plugged = battery.power_plugged
    percent = battery.percent

    if plugged:
        status = "Plugged in"
    else:
        status = "Not plugged in"

    desktop_path = os.path.expanduser("~/Desktop")
    folders = [name for name in os.listdir(desktop_path) if os.path.isdir(os.path.join(desktop_path, name))]

    context={
        'Icon' : Icons,
        'folders' : folders,
        'BIcons' : BIcons,
        'perc' : percent,
        'status' : status,
        'deskp': desktop_path,
    }
    return render(request,'home/templates/index.html',context)


def newD2(request, fName0):
    fName = request.GET.get('name')
    flag = request.GET.get('flag')
    print(flag)
    partitions = psutil.disk_partitions(all=True)
    folders = [partition.device for partition in partitions]
    fName0 = fName0.replace('/', '\\')  # Replace forward slash with backslash

    specified_path = fName0  # Specify the desired path here

    path = os.path.join(specified_path, fName)
    is_file = os.path.isfile(path)

    directory_list = []
    file_list = []

    if is_file:
        # Handle file case
        webbrowser.open(path)
        if os.path.exists(specified_path):
            for item in os.listdir(specified_path):
                item_path = os.path.join(specified_path, item)
                if os.path.isdir(item_path):
                    directory_list.append(item)
                else:
                    file_list.append(item)
    else:
        # Handle directory case
        if os.path.exists(fName0):
            for item in os.listdir(fName0):
                item_path = os.path.join(fName0, item)
                if os.path.isdir(item_path):
                    directory_list.append(item)
                else:
                    file_list.append(item)

    root = specified_path

    # Create the directory if it doesn't exist
    if flag=='2':
        if not os.path.exists(path):
            os.mkdir(path)
            print("Directory created successfully.")
        else:
            print("Directory already exists.")

    if flag=='3':
        if not os.path.exists(path):
            with open(path, 'w') as file:
                file.write('')  # You can write content to the file if needed
            print("File created successfully.")
        else:
            print("File already exists.")


    battery = psutil.sensors_battery()
    plugged = battery.power_plugged
    percent = battery.percent

    if plugged:
        status = "Plugged in"
    else:
        status = "Not plugged in"

    context = {
        'folders': directory_list,
        'files': file_list,
        'root': root,
        'perc': percent,
        'status': status,
    }
    return render(request, 'home/templates/insidepart.html', context)

hand_detector = mp.solutions.hands.Hands()
drawing_utils = mp.solutions.drawing_utils
screen_width, screen_height = pyautogui.size()
virtual_mouse_thread = None
stop_virtual_mouse = threading.Event()
virtual_rmouse_thread = None


def run_virtual_mouse():
    cap = cv2.VideoCapture(0)
    hand_detector = mp.solutions.hands.Hands()
    drawing_utils = mp.solutions.drawing_utils
    screen_width, screen_height = pyautogui.size()

    while True:
        _, frame = cap.read()
        frame = cv2.flip(frame, 1)
        frame_height, frame_width, _ = frame.shape
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        output = hand_detector.process(rgb_frame)
        hands = output.multi_hand_landmarks

        if hands:
            for hand in hands:
                drawing_utils.draw_landmarks(frame, hand, mp.solutions.hands.HAND_CONNECTIONS)

                index_x, index_y = 0, 0
                thumb_x, thumb_y = 0, 0
                middle_x, middle_y = 0, 0

                for id, landmark in enumerate(hand.landmark):
                    x = int(landmark.x * frame_width)
                    y = int(landmark.y * frame_height)

                    if id == 8:  # Index finger
                        index_x = x
                        index_y = y

                    if id == 4:  # Thumb finger
                        thumb_x = x
                        thumb_y = y

                    if id == 12:  # Middle finger
                        middle_x = x
                        middle_y = y

                # Draw circles around the fingers
                cv2.circle(frame, (int(index_x), int(index_y)), 10, (0, 255, 255), -1)
                cv2.circle(frame, (int(thumb_x), int(thumb_y)), 10, (0, 255, 255), -1)
                cv2.circle(frame, (int(middle_x), int(middle_y)), 10, (0, 255, 255), -1)

                # Calculate distances between fingers
                distance_index_middle = ((middle_x - index_x) ** 2 + (middle_y - index_y) ** 2) ** 0.5
                distance_index_thumb = ((thumb_x - index_x) ** 2 + (thumb_y - index_y) ** 2) ** 0.5

                if distance_index_middle < 50:
                    pyautogui.click()
                    pyautogui.sleep(1)
                elif distance_index_thumb < 80:
                    pyautogui.moveTo(index_x * (screen_width / frame_width), index_y * (screen_height / frame_height))

        cv2.imshow('Virtual Mouse', frame)
        key = cv2.waitKey(1)
        if key == ord('q'):
            # Killing thread
            if virtual_mouse_thread and virtual_mouse_thread.is_alive():
                stop_virtual_mouse.set()
                virtual_mouse_thread.join()
            break

    cap.release()
    cv2.destroyAllWindows()



def activateVM(request):
    global virtual_mouse_thread
    if not virtual_mouse_thread or not virtual_mouse_thread.is_alive():
        virtual_mouse_thread = threading.Thread(target=run_virtual_mouse)
        virtual_mouse_thread.start()

    Icons = IconsForDesktop.objects.all()
    BIcons = BottomSideIcons.objects.all()
    battery = psutil.sensors_battery()
    plugged = battery.power_plugged
    percent = battery.percent
    status = "Plugged in" if plugged else "Not plugged in"

    desktop_path = os.path.expanduser("~/Desktop")
    folders = [name for name in os.listdir(desktop_path) if os.path.isdir(os.path.join(desktop_path, name))]

    context = {
        'Icon': Icons,
        'folders': folders,
        'BIcons': BIcons,
        'perc': percent,
        'status': status,
        'deskp': desktop_path,
    }
    return render(request, 'home/templates/index.html', context)


def run_virtual_rmouse():
    cam = cv2.VideoCapture(0)
    print(cv2.__version__)
    face_mesh = mp.solutions.face_mesh.FaceMesh(refine_landmarks=True)
    screen_w, screen_h = pyautogui.size()
    while True:
        _, frame = cam.read()
        frame = cv2.flip(frame, 1)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        output = face_mesh.process(rgb_frame)
        landmark_points = output.multi_face_landmarks
        frame_h, frame_w, _ = frame.shape
        if landmark_points:
            landmarks = landmark_points[0].landmark
            for id, landmark in enumerate(landmarks[474:478]):
                x = int(landmark.x * frame_w)
                y = int(landmark.y * frame_h)
                cv2.circle(frame, (x, y), 3, (0, 255, 0))
                if id == 1:
                    screen_x = screen_w * landmark.x
                    screen_y = screen_h * landmark.y
                    pyautogui.moveTo(screen_x, screen_y)
            left = [landmarks[145], landmarks[159]]
            for landmark in left:
                x = int(landmark.x * frame_w)
                y = int(landmark.y * frame_h)
                cv2.circle(frame, (x, y), 3, (0, 255, 255))
            if (left[0].y - left[1].y) < 0.0085:
                pyautogui.click()
                pyautogui.sleep(1)
        cv2.imshow('Eye Controlled Mouse', frame)
        key = cv2.waitKey(1)
        if key is ord('q'):
            global virtual_rmouse_thread
            if not virtual_rmouse_thread or not virtual_rmouse_thread.is_alive():
                virtual_rmouse_thread = threading.Thread(target=run_virtual_rmouse)
                virtual_rmouse_thread.start()
            break
    cv2.destroyAllWindows()  # Close OpenCV windows

def activateRM(request):
    global virtual_rmouse_thread
    if not virtual_rmouse_thread or not virtual_rmouse_thread.is_alive():
        virtual_rmouse_thread = threading.Thread(target=run_virtual_rmouse)
        virtual_rmouse_thread.start()

    Icons = IconsForDesktop.objects.all()
    BIcons = BottomSideIcons.objects.all()
    battery = psutil.sensors_battery()
    plugged = battery.power_plugged
    percent = battery.percent
    status = "Plugged in" if plugged else "Not plugged in"

    desktop_path = os.path.expanduser("~/Desktop")
    folders = [name for name in os.listdir(desktop_path) if os.path.isdir(os.path.join(desktop_path, name))]

    context = {
        'Icon': Icons,
        'folders': folders,
        'BIcons': BIcons,
        'perc': percent,
        'status': status,
        'deskp': desktop_path,
    }
    return render(request, 'home/templates/index.html', context)

def execHand(request):
    HandGest1 = HandGest.objects.all()
    context={
        'HandGest1' : HandGest1,
    }
    return render(request,'home/templates/gesttabs.html',context)

def execHandTab(request):
    # Url
    fbUrl = 'https://www.facebook.com/'
    instaUrl = 'https://www.instagram.com/'
    meetUrl = 'https://meet.google.com/'

    # Variables
    width, height = 500, 500

    # Camera setup
    cap = cv2.VideoCapture(0)
    cap.set(3, width)
    cap.set(4, height)

    # Variables
    imgNumber = 0
    hs, ws = int(120 * 1), 213
    gestureThreshold = 300
    buttonPressed = False
    buttonCounter = 0
    buttonDelay = 30
    annotations = [[]]
    annotationNumber = -1
    annotationStart = False

    # Hand Detector
    detector = HandDetector(detectionCon=0.8, maxHands=2)

    while True:
        try:
            # Import images
            success, img = cap.read()
            img = cv2.flip(img, 1)

            hands, img = detector.findHands(img)

            if hands and len(hands) == 1:
                hand = hands[0]
                fingers = detector.fingersUp(hand)
                print(fingers)
                lmList = hand['lmList']

                # Constrain value for easier drawing
                indexFinger = lmList[8][0], lmList[8][1]
                xVal = int(np.interp(lmList[8][0], [width // 2, width], [0, width]))
                yVal = int(np.interp(lmList[8][1], [150, height - 150], [0, height]))

                indexFinger = xVal, yVal

                # Gesture1
                # Thumb = Open FaceBook
                if fingers == [1, 0, 0, 0, 0]:
                    webbrowser.open(fbUrl)
                    time.sleep(2)


                # Gesture 3
                # Thumb + Index + Middle Finger = Calculator
                if fingers == [1, 1, 1, 0, 0]:
                    calculator_process = subprocess.Popen('calc.exe')
                    # Close the calculator process
                    time.sleep(2)

                # Gesture 4
                # Thumb + Index + Middle + After Index = File
                if fingers == [1, 1, 1, 1, 0]:
                    subprocess.Popen('explorer')
                    time.sleep(2)

                # Gesture 5
                # ALl up = Whatsapp
                if fingers == [0, 1, 0, 0, 0]:
                    # Open whatsapp
                    webbrowser.open('https://web.whatsapp.com/')
                    time.sleep(2)

                # #Gesture 6
                # Pinki and Thumb = Settings
                if fingers == [1, 0, 0, 0, 1]:
                    subprocess.Popen('explorer.exe ms-settings:')
                    time.sleep(2)

                # #Gesture 7
                # Thumb + Index + Pinki = Mail
                if fingers == [1, 1, 0, 0, 1]:
                    webbrowser.open('mailto:')
                    time.sleep(2)



        except BrokenPipeError as e:
            pass

        cv2.imshow("Image", img)
        key = cv2.waitKey(1)
        if key == ord('q'):
            break
    cv2.destroyAllWindows()

    Icons = IconsForDesktop.objects.all()
    BIcons = BottomSideIcons.objects.all()
    desktop_path = os.path.expanduser("~/Desktop")
    folders = [name for name in os.listdir(desktop_path) if os.path.isdir(os.path.join(desktop_path, name))]

    Icons = IconsForDesktop.objects.all()
    BIcons = BottomSideIcons.objects.all()
    battery = psutil.sensors_battery()
    plugged = battery.power_plugged
    percent = battery.percent

    if plugged:
        status = "Plugged in"
    else:
        status = "Not plugged in"

    desktop_path = os.path.expanduser("~/Desktop")
    folders = [name for name in os.listdir(desktop_path) if os.path.isdir(os.path.join(desktop_path, name))]

    context = {
        'Icon': Icons,
        'folders': folders,
        'BIcons': BIcons,
        'perc': percent,
        'status': status,
        'deskp' : desktop_path,
    }

    return render(request, 'home/templates/index.html', context)