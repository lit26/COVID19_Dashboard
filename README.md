# COVID-19 US Case Map

## About this app

This is a COVID-19 Dashboard using the Dash interactive Python framework.

## How to run this app

(The following instructions apply to command line.)

Create and activate a new virtual environment (recommended) by running
the following:

On Windows

```
virtualenv venv 
\venv\scripts\activate
```

Or if using linux

```bash
python3 -m virtualenv venv
source venv/bin/activate
```

Install the requirements:

```
pip3 install -r requirements.txt
```
Run the app:

```
python3 app.py
```
You can run the app on your browser at http://127.0.0.1:8050

## Data Update

This app will download data from Johns Hopkins CSSE (https://github.com/CSSEGISandData/COVID-19) and will preprocess the data for this app.

## Screenshots

![screenshot1](assets/screenshot1.gif)
![screenshot2](assets/screenshot2.gif)

## Resources
Data Source: Johns Hopkins CSSE (https://github.com/CSSEGISandData/COVID-19)
Dash Documentation: https://plotly.com/
