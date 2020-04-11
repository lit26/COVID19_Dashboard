import os
import pandas as pd
import numpy as np
import shutil

class Covid19Data:
    def __init__(self, country):
        self.country = country
        self.df_trend = []
        self.n = 0
        self.t = []
    
    def getData(self):
        isdir = os.path.isdir('COVID-19')
        if isdir:
            shutil.rmtree('COVID-19')
        bashCommand = "git clone https://github.com/CSSEGISandData/COVID-19"
        os.system(bashCommand)
        
    def readFile(self,base_path, file,choice, col_name):
        df_file= pd.read_csv(base_path+file)
    
        df_file = df_file.drop(["UID","iso2","iso3","code3","FIPS","Country_Region","Combined_Key"], axis=1)
        df_file = df_file.reset_index(drop=True)
        if choice =='Deaths':
            df_file = df_file.drop(["Population"], axis=1)
        df_county= df_file.iloc[:,0:4]
        df_diff = df_file.iloc[:,4:len(df_file.columns)].diff(axis=1)
        df_diff = df_county.join(df_diff)
        df_file = df_file.melt(id_vars=col_name, 
                var_name="Date", 
                value_name=choice)
        df_diff=df_diff.melt(id_vars=col_name, 
                var_name="Date", 
                value_name=choice)
        df_diff = df_diff.rename(columns={choice: "Daily_"+choice})
        df_file = df_file.merge(df_diff, on=['Date']+col_name)
        df_file['Date'] = pd.to_datetime(df_file['Date'])
        df_file['Date']=df_file['Date'].apply(lambda x:x.date())
        return df_file
    
    def readData(self):
        col_name= ["Province_State","Admin2","Lat","Long_"]
        base_path = 'COVID-19/csse_covid_19_data/csse_covid_19_time_series/'
        df = self.readFile(base_path, 'time_series_covid19_confirmed_US.csv','Confirmed',col_name)
                
        df2 = self.readFile(base_path, 'time_series_covid19_deaths_US.csv','Deaths',col_name)
        df = df.merge(df2, on=['Date','Province_State', 'Admin2'])
        
        df = df.drop(['Lat_y', 'Long__y'], axis=1)
        df = df.rename(columns={"Lat_x": "Lat", "Long__x": "Long_"})
        df = df.drop(df[(df.Confirmed ==0) & (df.Deaths ==0)].index)
        df[["Confirmed","Deaths","Daily_Confirmed","Daily_Deaths"]] = \
            df[["Confirmed","Deaths","Daily_Confirmed","Daily_Deaths"]].fillna(0)
        df = df.reset_index(drop=True)
        self.df_trend = df
        self.t = df['Date'].unique()
        self.n = len(df)
        return df
    
    def getDate(self):
        return self.t
    
    def getCSV(self):
        self.df_trend=self.df_trend[["Province_State","Admin2","Lat","Long_","Date","Confirmed","Deaths",
                          "Daily_Confirmed","Daily_Deaths"]]
        self.df_trend.to_csv('data/data.csv', index=False)











