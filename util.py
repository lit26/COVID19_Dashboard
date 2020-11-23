import pandas as pd

state_list = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', \
            'Diamond Princess', 'District of Columbia', 'Florida', 'Georgia', 'Grand Princess', 'Guam', 'Hawaii', 
            'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', \
            'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', \
            'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Northern Mariana Islands', 'Ohio', 'Oklahoma', 'Oregon', \
            'Pennsylvania', 'Puerto Rico', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', \
            'Virgin Islands', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming']
def readFile(base_path, file, choice, col_name):
    df_file = pd.read_csv(base_path+file)

    df_file = df_file.drop(
        ["UID", "iso2", "iso3", "code3", "FIPS", "Country_Region", "Combined_Key"], axis=1)
    if choice == 'Deaths':
        df_file = df_file.drop(["Population"], axis=1)
    df_county = df_file.iloc[:, 0:4]
    df_diff = df_file.iloc[:, 4:len(df_file.columns)].diff(axis=1)
    df_diff = df_county.join(df_diff)
    df_file = df_file.melt(id_vars=col_name,
                           var_name="Date",
                           value_name=choice)
    df_diff = df_diff.melt(id_vars=col_name,
                           var_name="Date",
                           value_name=choice)
    df_diff = df_diff.rename(columns={choice: "Daily_"+choice})
    df_file = df_file.merge(df_diff, on=['Date']+col_name)
    df_file['Date'] = pd.to_datetime(df_file['Date'])
    return df_file

def readData():
    col_name = ["Province_State", "Admin2", "Lat","Long_"]
    base_path = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/'
    df = readFile( base_path, 'time_series_covid19_confirmed_US.csv', 'Confirmed', col_name)
    df2 = readFile(base_path, 'time_series_covid19_deaths_US.csv', 'Deaths', col_name)
    df = df.merge(df2, on=['Date', 'Province_State', 'Admin2'])

    df = df.drop(['Lat_y', 'Long__y'], axis=1)
    df = df.rename(columns={"Lat_x": "Latitude", "Long__x": "Longitude"})
    df = df.drop(df[(df.Confirmed == 0) & (df.Deaths == 0)].index)
    df[["Confirmed", "Deaths", "Daily_Confirmed", "Daily_Deaths"]] = \
        df[["Confirmed", "Deaths", "Daily_Confirmed", "Daily_Deaths"]].fillna(0)
    return df[["Province_State", "Admin2", "Latitude", "Longitude","Date","Confirmed","Deaths",
               "Daily_Confirmed", "Daily_Deaths"]]


