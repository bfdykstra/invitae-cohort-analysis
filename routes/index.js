const express = require('express');
const ObjectsToCsv = require('objects-to-csv');
const createError = require('http-errors');

const { formatForCSV } = require('../services/generalUtils');

const {
  getCustomersWithOrders,
  splitCohorts,
  countCustomersByCohort,
} = require('../services/customers');

const {
  markFirstOrders,
  getDistinctUserAndOrderCount,
  groupOrdersByTimeFromCustomerJoin,
} = require('../services/orders');


const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.send('hey this is the homepage');
});

/* GET cohort reports */
router.get('/cohort-report', async (req, res) => {
  try {
    const customers = await getCustomersWithOrders();
    console.log('customers: ', customers);
    // mark the customers first orders
    await markFirstOrders(customers);

    // split up the customers in to their cohorts
    const customersByCohort = splitCohorts(customers);

    // Get the count of the customers in each cohort
    const cohortsWithCustCounts = countCustomersByCohort(customersByCohort);

    // Group each cohorts orders up by the time from when they joined and when the order was placed
    const cohortsWithOrderGroups = groupOrdersByTimeFromCustomerJoin(cohortsWithCustCounts);

    // get count of distinct users and first time orders for each order group
    const customersWithDistinctCounts = getDistinctUserAndOrderCount(cohortsWithOrderGroups);

    // prepare the object to be output to a csv
    const timeDiffArr = ['0 - 6 days', '7 - 13 days', '14 - 20 days', '21 - 27 days', '28 - 34 days', '35 - 41 days', '42+ days'];
    const allCohortsArr = Object.keys(customersWithDistinctCounts);

    const rows = formatForCSV(customersWithDistinctCounts, allCohortsArr, timeDiffArr);

    const csv = new ObjectsToCsv(rows);

    // Save the rows to file:
    await csv.toDisk('./data/cohort_report.csv');

    res.json({
      message: 'Successfully wrote cohort report to data/cohort_report.csv!',
      data: rows,
    });
  } catch (error) {
    res.send(createError(500, `Something went wrong creating the cohort report: ${error.message}`));
    // res.status(500).json
  }
});

module.exports = router;
