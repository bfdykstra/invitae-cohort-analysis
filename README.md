# Invitae Cohort Analysis

This project groups customers into cohorts based on when they joined, and then analyzes their subsequent purchasing behavior.
This project is very simple to use, all you need to do is start it, and then in a browser, navigate to localhost:3000/cohort-report to generate your report.

The API is built in node.js and PostgreSQL, using express and the sequelize ORM to interact with the database. This API uses a simple relational model where each customer has 0 or many orders.

Initially, I tried to solve this challenge using in Python using Pandas and Numpy, but I then pivoted towards a relational model where the customers and orders are stored in a database. This has the advantage of much more testable, refactorable and reusable code. You can view my preliminary work in a python jupyter notebook [here](https://github.com/bfdykstra/invitae-cohort-analysis/blob/master/Invitae.ipynb).


## Getting Started
TLDR: 
Open a terminal, git clone this repo and navigate to the root of the project.

To start the API, from the project root execute:
```
docker-compose up -d # builds the api and database containers and leaves them running in the background
docker exec app ./node_modules/.bin/sequelize db:migrate # creates the necessary tables in the Database
docker exec app ./node_modules/.bin/sequelize db:seed:all # seeds the tables with the data from the given csvs
```

Navigate to localhost:3000/cohort-report to generate the cohort report

To get the output file to your local machine, execute:
```
docker cp app:/usr/src/app/data/cohort_report.csv /your/path/on/local/<your file name>.csv
```

Then open the CSV file in your favorite editor to view the analysis!

The API is exposed on port 3000, and the database is on port 8000

## Requirements

You will need (Docker)[https://www.docker.com/products/docker-desktop] and (Git)[https://git-scm.com/book/en/v2/Getting-Started-Installing-Git] to run this project. If you are running on macOS Mavericks or above, you should already have XCode command line tools baked in, so you can run `git --version` to check which version of git you have.

If you would like to run the application on your local machine without a container you will need Node.js 8.9.1 and PostgreSQL 11.5. To get Node.js installed, I like to use the (Node Version Manager)[https://github.com/nvm-sh/nvm] where I can easily install different Node versions and switch between them. For PostgreSQL, if you are on macOS I love using (Postgres.app)[https://postgresapp.com/]. It automatically installs the Postgres CLI, and it comes with a really useful desktop app. I find it pairs nicely with an app called (Postico)[https://eggerapps.at/postico/]. If you are not on a mac, you can use https://www.enterprisedb.com/downloads/postgresql to get a Postgres install.

## Setting up and Starting the application

To setup the application, clone this repository. Then, ensure that you have Postgres running. From the root of the project, run `npm install` to install all of the dependencies. 

After you have installed all of the dependencies, you need to set up the tables in the database and seed those tables with data. To do this execute `./node_modules/.bin/sequelize db:migrate` and then `./node_modules/.bin/sequelize db:seed:all`. Now you're all set and ready to use the application!

## Using the application
From the project root execute: `npm run start`, or to run it in a development environment `npm run dev`.

### Running tests
From the project root execute: `npm run test`. This project uses mocha and chai to run functional tests, with instabul code coverage reporting.

## Future work
- [ ] Write tests that mock database interactions
- [ ] Increase testing code coverage
- [ ] Integration tests
- [ ] Deploy in AWS
- [ ] Front end where you can view the cohort report, and choose to download the full report


# The Challenge
 
We would like to perform a cohort analysis on our customers to help identify changes in ordering behavior based on their signup date.
 
For this exercise group the customers into week long (7 days) cohorts and then calculate how many *distinct* customers ordered within X days from their signup date, where X is a multiple of 7. Older cohorts will have more buckets: 0-6 days, 7-13 days, 14-20 days, etc.
 
# The Solution
 
You may write your solution in the language of your choice, but we do have a preference towards Python (preferably using 3.6 or 3.7 with type hints). We suggest approaching this more like a work assignment than a personal project so please provide a README with clear instructions on how to setup any dependencies and execute your program. We also expect production quality testable code ideally with tests included as part of the project and ideally a build and execute script or maybe a dockerized version of the app with instructions on how to build and run. The program should output an HTML table or CSV in a format similar to:
 
| Cohort      | Customers     | 0-6 days          | 7-13 days         | 14-20 days       | ....       |
|-------------|---------------|-------------------|-------------------|------------------|------------|
| 7/1-7/7     | 300 customers | 25% orderers (75) |                   |                  |            |
|             |               | 25% 1st time (75) |                   |                  |            |
| 6/24-6/30   | 200 customers | 15% orderers (30) | 5% orderers (10)  |                  |            |
|             |               | 15% 1st time (30) | 1.5% 1st time (3) |                  |            | 
| 6/17-6/23   | 100 customers | 30% orderers (30) | 10% orderers (10) | 15% orderers (15)|            |
|             |               | 30% 1st time (30) | 3% 1st time (3)   | 5% 1st time (5)  |            |
| ...         | ...           | ...               | ...               | ...              | ...        |
 
The program should read the data from both customers.csv and orders.csv and calculate at least 8 weeks of cohorts. All dates are stored in UTC but grouping should be handled in a configurable timezone (ex: PDT). Also please consider the given datasets as small sample datasets, and keep in mind that relatively larger datasets might be given to the program.
 
After a few submissions that were clearly simple adaptations of Greg Reda's blog post "Cohort Analysis with Python" we are asking submitters to not use guides or examples when doing this exercise and to solve the problem on their own. However, information about what a cohort analysis is and how it is used (ex: http://www.cohortanalysis.com/ ) is completely fine.