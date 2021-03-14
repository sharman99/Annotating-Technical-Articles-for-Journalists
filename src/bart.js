export function getDoBart(sectionTexts) {

  let cache = {};

  return (sectionName) => {

    const key = sectionName;
    const rawText = sectionTexts.find(s => s.name === sectionName).text;
    const TOKEN_LIMIT = 500;
    const text = rawText.split(" ").slice(0, TOKEN_LIMIT).join(" ");

    return new Promise((resolve, reject) => {
      if (key in cache) {
        console.log('Returning from Bart cahce for key', key, ')');
        resolve(cache[key]);
      } else {

        cache[key] = 'Loading...';

        const body = JSON.stringify({ text });
        const headers = { 'Content-Type': 'application/json' };
        const SERVER = 'http://agile-journey-26810.herokuapp.com';

        const requestOptions = { body, headers, method: 'POST' };
        fetch(SERVER + '/bart', requestOptions)
          .then(res => res.json())
          .then(rawData => {

            console.log('Bart endpoint responded with ', key);
            const data = rawData['summary_text'];
            cache[key] = data;
            resolve(data);

          }).catch(reject);

      }

    });

  };

}
