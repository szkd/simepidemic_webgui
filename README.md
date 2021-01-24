# SimEpidemic GUI for Web browser
Individual-based Epidemic Simulator (2020-21)

This is an individual-based simulator to help understanding the dynamics of epidemic, spread of infectous disease, mainly targetting SARS-CoV-2.

+ As a part of a [project](http://www.intlab.soka.ac.jp/~unemi/SimEpidemic1/info/) by Tatsuo Unemi, under cooperation with Saki Nawata and Masaaki Miyashita.
+ Supported by Cabinet Secretariat of Japanese Government.

This repository includes web pages for interaction with [SimEpidemic HTTP server](https://github.com/unemi/SimEpidemic) version 1.3.. 

## Usage
+ To get stable HTML/CSS/JavaScript (You have to build and run SimEpi HTTP Server)
  - Checkout `version{number}.x` branch
  - Move `Simepidemic/*` to your DocumentRoot
  - Edit `const SERVERNAME` in scripts/script.js to `"http://your/server/name/"`
+ To get latest (unstable) version
  - Checkout `dev` branch
  - Command `python pageBuilder.py` (Python 3.6.*)

&copy; Saki Nawata, 2020-21, All rights reserved.

---
