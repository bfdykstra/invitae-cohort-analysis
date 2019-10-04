const express = require('express');
const ObjectsToCsv = require('objects-to-csv');
const createError = require('http-errors');
const logger = require('../logger');
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
  res.send('Hey this is the homepage :)');
});


/**
 * GET cohort reports
 * @returns {Object} Responds with JSON object with the fields message and data. The data field has
 * the JSON representation of the cohort report
 */
router.get('/cohort-report', async (req, res) => {
  try {
    const customers = await getCustomersWithOrders();

    if (customers.error) throw customers;

    // Mark the customers first orders
    const markedOrders = await markFirstOrders(customers);

    // Split up the customers in to their cohorts
    const customersByCohort = splitCohorts(markedOrders);

    // Get the count of the customers in each cohort
    const cohortsWithCustCounts = countCustomersByCohort(customersByCohort);

    // Group each cohorts orders up by the time from when they joined and when the order was placed
    const cohortsWithOrderGroups = groupOrdersByTimeFromCustomerJoin(cohortsWithCustCounts);

    // Get count of distinct users and first time orders for each order group
    const customersWithDistinctCounts = getDistinctUserAndOrderCount(cohortsWithOrderGroups);

    // Prepare the object to be output to a csv
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
    logger.error('error creating cohort report: ', error.message || error);
    res.send(createError(500, `Something went wrong creating the cohort report: ${error.message}`));
  }
});

module.exports = router;
