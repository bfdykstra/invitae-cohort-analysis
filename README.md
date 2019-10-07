# Invitae Cohort Analysis

This project groups customers into cohorts based on when they joined, and then analyzes their subsequent purchasing behavior.
This project is very simple to use - all you need to do is start it and then in a browser navigate to localhost:3000/cohort-report to generate your report.

The API is built with Node.js and PostgreSQL, using express and the sequelize ORM to interact with the database. This API uses a simple relational model where each customer has 0 or many orders.

Initially, I tried to solve this challenge using in Python using Pandas and Numpy, but I then pivoted towards a relational model where the customers and orders are stored in a database. This has the advantage of much more testable, refactorable and reusable code. You can view my preliminary work in a python jupyter notebook [here](https://github.com/bfdykstra/invitae-cohort-analysis/blob/master/Invitae.ipynb).


## Getting Started

Open a terminal, git clone this repo and navigate to the root of the project.

To start the API:
```
docker-compose up -d # builds the api and database containers and leaves them running in the background

docker exec app ./node_modules/.bin/sequelize db:migrate # creates the necessary tables in the Database

docker exec app ./node_modules/.bin/sequelize db:seed:all # seeds the tables with the data from data/customers.csv and data/orders.csv
```

Navigate to localhost:3000/cohort-report to generate the cohort report

To get the output file to your local machine, execute:
```
docker cp app:/usr/src/app/data/cohort_report.csv /your/path/on/local/<your file name>.csv
```

Then open the CSV file in your favorite editor to view the analysis!

The API is exposed on port 3000, and the database is on port 8000

## Requirements

You will need [Docker](https://www.docker.com/products/docker-desktop) and [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) to run this project. If you are running on macOS Mavericks or above, you should already have XCode command line tools baked in, so you can run `git --version` to check which version of git you have.

### If you would like to run the application on your local machine without a container
You will need Node.js 8.9.1 and PostgreSQL 11.5. 

To get Node.js installed, I like to use the [Node Version Manager](https://github.com/nvm-sh/nvm) where I can easily install different Node versions and switch between them. For PostgreSQL, if you are on macOS I love using [Postgres.app](https://postgresapp.com/). It automatically installs the Postgres CLI, and it comes with a really useful desktop app. I find it pairs nicely with an app called [Postico](https://eggerapps.at/postico/). If you are not on a mac, you can use https://www.enterprisedb.com/downloads/postgresql to get a Postgres install.

## Setting up and Starting the application

To setup the application, git clone this repository. Then, ensure that you have Postgres running. 

From the root of the project:
```bash
npm install # install all dependencies

./node_modules/.bin/sequelize db:migrate # set up all the tables in the Database

./node_modules/.bin/sequelize db:seed:all # seed the tables with the data from the csvs
```
Now you're all set and ready to use the application!

To start:
```
npm run start

# or for development environment with hot reloading

npm run dev
```

## Using the application
The API is exposed at at localhost:3000. As of right now, there are only two routes defined, one at localhost:3000/ and localhost:3000/cohort-report. The home (/) route only returns some text that says you're at the home page. The /cohort-report endpoint creates a cohort report csv at data/cohort_report.csv. It returns a json object with a message and data field. The message field indicates where the output is, and the data field is the csv data in an array of objects that could be consumed by a front end client (say a client using [react-table](https://www.npmjs.com/package/react-table).

### Running tests
From the project root execute: `npm run test`. 

This project uses mocha and chai to run functional tests, with instanbul code coverage reporting.

## Future work
- [ ] Write tests that mock database interactions
- [ ] Increase testing code coverage
- [ ] Integration tests
- [ ] Deploy in AWS
- [ ] Front end where you can view subsections of the cohort report, and choose to download the full report
- [ ] More order time differences, rather than ending at 42+ days
