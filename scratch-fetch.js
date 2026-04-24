const fs = require('fs');
fetch('https://himalayas.app/jobs/api?limit=1')
  .then(res => res.json())
  .then(data => fs.writeFileSync('himalayas-sample.json', JSON.stringify(data, null, 2)))
  .catch(console.error);
