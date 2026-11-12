#!/usr/bin/env python3
"""Exercise the installed wrapper in a disposable emulator, retaining real UI evidence.

Chrome first-run prompts are disabled only on the test device. HTTPS and Digital
Asset Links verification remain enabled; an unsigned domain uses Custom Tabs.
"""
import argparse
import json
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--apk', required=True, type=Path)
parser.add_argument('--serial', default='emulator-5554')
parser.add_argument('--output', default='output/android-device', type=Path)
args = parser.parse_args()
if not re.fullmatch(r'emulator-\d+', args.serial):
    parser.error('Use a disposable emulator, never a personal Android device.')
args.output.mkdir(parents=True, exist_ok=True)
config = json.loads(Path('release/play.json').read_text())
package = config['packageId'] + '.debug'
component = package + '/' + config['packageId'] + '.MarketDeskActivity'
checks = []


def adb(*command, timeout=30, binary=False):
    result = subprocess.run(
        ['adb', '-s', args.serial, *command], capture_output=True,
        timeout=timeout, check=True,
    )
    return result.stdout if binary else result.stdout.decode('utf-8', errors='replace')


def shell(*command, **kwargs):
    return adb('shell', *command, **kwargs)


def hierarchy():
    shell('uiautomator', 'dump', '/sdcard/marketdesk-ui.xml', timeout=25)
    xml = shell('cat', '/sdcard/marketdesk-ui.xml')
    (args.output / 'last-ui.xml').write_text(xml)
    return ET.fromstring(xml)


def find_text(root, text):
    return next((node for node in root.iter('node') if text in (
        node.get('text'), node.get('content-desc'))), None)


def wait_text(text, seconds=90):
    end = time.monotonic() + seconds
    while time.monotonic() < end:
        try:
            node = find_text(hierarchy(), text)
            if node is not None:
                return node
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, ET.ParseError):
            pass
        time.sleep(2)
    raise AssertionError('Android screen did not show: ' + text)


def capture(name):
    hierarchy()
    (args.output / (name + '.xml')).write_bytes((args.output / 'last-ui.xml').read_bytes())
    (args.output / (name + '.png')).write_bytes(adb('exec-out', 'screencap', '-p', binary=True))


def launch(uri=None):
    shell('am', 'force-stop', package)
    command = ['am', 'start', '-W', '-n', component]
    if uri is not None:
        command.extend(['-a', 'android.intent.action.VIEW', '-d', uri])
    result = shell(*command, timeout=60)
    if 'Status: ok' not in result:
        raise AssertionError('Activity did not launch: ' + result)


def passed(name):
    checks.append(name)
    print('PASS ' + name, flush=True)


try:
    deadline = time.monotonic() + 300
    while time.monotonic() < deadline:
        try:
            if shell('getprop', 'sys.boot_completed', timeout=10).strip() == '1':
                break
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
            pass
        time.sleep(2)
    else:
        raise AssertionError('Accelerated Android device did not boot within 5 minutes')
    for setting in ('window_animation_scale', 'transition_animation_scale', 'animator_duration_scale'):
        shell('settings', 'put', 'global', setting, '0')
    shell('input', 'keyevent', 'KEYCODE_WAKEUP')
    shell('wm', 'dismiss-keyguard')
    if 'package:' not in shell('pm', 'path', 'com.android.chrome'):
        raise AssertionError('The Google Play emulator image must include Chrome')
    # A debug browser can read this device-local file without a root/modified image.
    shell('am', 'set-debug-app', '--persistent', 'com.android.chrome')
    flags = args.output / 'chrome-command-line'
    flags.write_text('chrome --disable-fre --no-first-run --no-default-browser-check\n')
    adb('push', str(flags), '/data/local/tmp/chrome-command-line')
    shell('am', 'force-stop', 'com.android.chrome')
    adb('install', '-r', str(args.apk), timeout=120)
    launch()
    wait_text('거래 상품')
    wait_text('PRACTICE')
    capture('01-game-launched')
    passed('installed APK opens the public practice game')

    node = wait_text('포트폴리오')
    coordinates = list(map(int, re.findall(r'\d+', node.get('bounds', ''))))
    if len(coordinates) != 4 or coordinates[2] <= coordinates[0] or coordinates[3] <= coordinates[1]:
        raise AssertionError('Portfolio control has no tappable bounds')
    x1, y1, x2, y2 = coordinates
    shell('input', 'tap', str((x1 + x2) // 2), str((y1 + y2) // 2))
    wait_text('보유 포지션')
    capture('02-portfolio')
    shell('input', 'keyevent', 'KEYCODE_BACK')
    wait_text('거래 상품')
    capture('03-android-back')
    passed('native Back returns from portfolio to trading')

    launch(config['origin'] + '/privacy')
    wait_text('개인정보 처리 안내')
    capture('04-privacy-link')
    passed('allowed HTTPS deep link opens the privacy page')

    for name, uri in (
        ('external-origin', 'https://example.invalid/'),
        ('unknown-path', config['origin'] + '/not-a-game-route'),
    ):
        launch(uri)
        wait_text('거래 상품')
        capture('05-rejected-' + name)
        passed('untrusted ' + name + ' falls back to the game')
finally:
    result = {
        'checks_passed': checks, 'all_passed': len(checks) == 5,
        'origin': config['origin'], 'package': package,
        'scope': 'debug APK with real Chrome; Custom Tab fallback; no production TWA certification',
    }
    (args.output / 'result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    for name, command in (
        ('logcat.txt', ('logcat', '-d', '-t', '3000')),
        ('activities.txt', ('shell', 'dumpsys', 'activity', 'activities')),
    ):
        try:
            (args.output / name).write_text(adb(*command, timeout=20))
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
            pass
    try:
        shell('am', 'clear-debug-app', timeout=10)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        pass
