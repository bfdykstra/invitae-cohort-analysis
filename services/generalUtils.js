const moment = require('moment');

/**
 * This function is from here: https://gist.github.com/JamieMason/0566f8412af9fe6a1d470aa1e089a752.
 * Using this, because it's much easier than trying to use Sequelize with groups and aggregate
 * functions
 * @param {String} key key in which to groupby
 * @param {Array} array the array of objects that get grouped by the above key
 * @returns {Object} An object in which the keys are the distinct values of the
 * given groupby key, and each corresponding value is an array of objects, in which each object
 * has the corresponding key value
 */
const groupBy = (key) => (array) => array.reduce((objectsByKeyValue, obj) => {
  const value = obj[key];
  // eslint-disable-next-line no-param-reassign
  objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
  return objectsByKeyValue;
}, {});


/**
 * Format a given year and week string so that it returns a string of the start
 * date of the week, and the end date of the week
 * @param {String} cohortWeek Cohort week string, formatted like YYYY_ww
 * @returns {String} Start of the week - End of the week, formatted like M/DD - M/DD
 */
const formatCohortDate = (cohortWeek) => `${moment(cohortWeek, 'YYYY_ww').startOf('week').format('M/DD')} - ${moment(cohortWeek, 'YYYY_ww').endOf('week').format('M/DD')}`;


/**
 * Format the given allCohorts object so that it can be written to a csv.
 * @param {Object} allCohorts Object that has arrays of customers by the week that they
 * joined, and order object that has each cohorts orders grouped by the time difference from the
 * start of the cohort
 * @param {Array<String>} cohortWeekArr A sorted array of all of the cohort weeks
 * @param {Array<String>} orderTimeDiffArr An array of all the time difference strings for orders
 */
const formatForCSV = (allCohorts, cohortWeekArr, orderTimeDiffArr) => cohortWeekArr.map(
  (cohortWeek) => {
    const rowOb = {
      Cohort: formatCohortDate(cohortWeek),
      Customers: allCohorts[cohortWeek] ? `${allCohorts[cohortWeek].nCustomers} Customers` : '',
    };

    // get each time diff in as a column
    orderTimeDiffArr.forEach((timeDiff) => {
      rowOb[timeDiff] = allCohorts[cohortWeek] && allCohorts[cohortWeek].orders[timeDiff]
        ? `${allCohorts[cohortWeek].orders[timeDiff].distinctUserCount}, ${allCohorts[cohortWeek].orders[timeDiff].firstOrderCount}`
        : '';
    });

    return rowOb;
  },
);


module.exports = {
  formatForCSV,
  groupBy,
  formatCohortDate,
};
