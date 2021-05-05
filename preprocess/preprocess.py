import pandas as pd
import datetime

# load csv into dataframe
df = pd.read_csv('../data/game_info.csv')

# columns to drop
drop_columns = ['slug', 'tba', 'updated', 'website', 'rating_top', 'game_series_count', 'added_status_yet',
                'added_status_owned', 'added_status_beaten', 'added_status_toplay', 'added_status_dropped',
                'added_status_playing']

# drop columns
df = df.drop(columns=drop_columns, axis=1)

# remove date entries after Dec 22, 2020
df = df[(df['released'] < "2020-12-22")]

# remove empty rating games
df = df[(df['rating'] > 0)]

# save new CSV
df.to_csv("../data/game_info_processed.csv", index=None)