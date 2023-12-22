import requests
from bs4 import BeautifulSoup
from time import sleep
import json
from random import shuffle

DELAY = 5
RATINGS_FILE = 'christmas_ratings.json'
BOT_CONFIG_FILE = 'bot_config.json'
f = open(RATINGS_FILE, 'r')
RATINGS = json.load(f)
f.close()

def convertRankToRatings(rank):
    d = {
        'Legendary Grandmaster': 3000,
        'International Grandmaster': 2600,
        'Grandmaster': 2400,
        'International Master': 2300,
        'Master': 2100,
        'Candidate Master': 1900,
        'Expert': 1600,
        'Specialist': 1400,
        'Pupil': 1200,
        'Newbie': 0,
        'Unrated': 0,
    }
    if rank in d:
        return d[rank]
    return -1


def getRatingsWebScraping(handle):
    # Returns -1 in case of any error
    url = 'https://codeforces.com/profile/' + handle
    try:
        r = requests.get(url)
        soup = BeautifulSoup(r.content, 'html.parser')
        rank = soup.find_all('div', class_='user-rank')[0].span.text.strip()
        return convertRankToRatings(rank)
    except:
        return -1


def updateRatings(handle, ratings):
    RATINGS[handle] = ratings
    with open(RATINGS_FILE, 'w') as f:
        json.dump(RATINGS, f)
    # print('Updated ratings of ' + handle + ' to ' + str(ratings))


def main():
    handles = set()
    with open(BOT_CONFIG_FILE) as f:
        data = json.load(f)
        for group in data['groups'].values():
            if not group['enabled']:
                continue
            for handle in group['handles']:
                handles.add(handle.lower())
    handles = list(handles)
    shuffle(handles)
    for handle in handles:
        ratings = getRatingsWebScraping(handle)
        if ratings != -1:
            if handle not in RATINGS or RATINGS[handle] != ratings:
                updateRatings(handle, ratings)
        sleep(DELAY)



if __name__ == '__main__':
    while 1:
        try:
            main()
        except Exception as e:
            print('Unknown error: ', e)
            print('Retrying in ' + str(DELAY * 10) + ' seconds')
            sleep(DELAY * 10)
    