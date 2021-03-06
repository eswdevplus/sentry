import {Client} from 'app/api';

import {isValidAggregation} from './aggregations/utils';

export function getQueryFromQueryString(queryString) {
  if (!queryString) {
    return {};
  }
  let parsedQuery = queryString;
  let result = {};
  parsedQuery = parsedQuery.replace(/^\?|\/$/g, '').split('&');
  parsedQuery.forEach(item => {
    if (item.includes('=')) {
      let key = item.split('=')[0];
      let value = JSON.parse(decodeURIComponent(item.split('=')[1]));
      result[key] = value;
    }
  });

  return result;
}

export function getQueryStringFromQuery(query) {
  const queryProperties = Object.entries(query).map(([key, value]) => {
    return key + '=' + encodeURIComponent(JSON.stringify(value));
  });

  return `?${queryProperties.join('&')}`;
}

export function getOrderByOptions(queryBuilder) {
  const columns = queryBuilder.getColumns();
  const query = queryBuilder.getInternal();

  // If there are valid aggregations, only allow summarized fields and aggregations in orderby
  const validAggregations = query.aggregations.filter(agg =>
    isValidAggregation(agg, columns)
  );

  const hasAggregations = validAggregations.length > 0;

  const hasFields = query.fields.length > 0;

  const columnOptions = columns.reduce((acc, {name}) => {
    if (hasAggregations) {
      const isInvalidField = hasFields && !query.fields.includes(name);
      if (!hasFields || isInvalidField) {
        return acc;
      }
    }

    return [
      ...acc,
      {value: name, label: `${name} asc`},
      {value: `-${name}`, label: `${name} desc`},
    ];
  }, []);

  const aggregationOptions = [
    // Ensure aggregations are unique (since users might input duplicates)
    ...new Set(validAggregations.map(aggregation => aggregation[2])),
  ].reduce((acc, agg) => {
    return [
      ...acc,
      {value: agg, label: `${agg} asc`},
      {value: `-${agg}`, label: `${agg} desc`},
    ];
  }, []);

  return [...columnOptions, ...aggregationOptions];
}

/**
 * Takes a saved query and strips associated query metadata in order to match
 * our internal representation of queries.
 *
 * @param {Object} savedQuery
 * @returns {Object}
 */
export function parseSavedQuery(savedQuery) {
  // eslint-disable-next-line no-unused-vars
  const {id, name, dateCreated, dateUpdated, createdBy, ...query} = savedQuery;
  return query;
}

export function fetchSavedQuery(organization, queryId) {
  const api = new Client();
  const endpoint = `/organizations/${organization.slug}/discover/saved/${queryId}/`;

  return api.requestPromise(endpoint, {
    method: 'GET',
  });
}

export function fetchSavedQueries(organization) {
  const api = new Client();
  const endpoint = `/organizations/${organization.slug}/discover/saved/`;

  return api.requestPromise(endpoint, {
    method: 'GET',
  });
}

export function createSavedQuery(organization, data) {
  const api = new Client();
  const endpoint = `/organizations/${organization.slug}/discover/saved/`;

  return api.requestPromise(endpoint, {
    method: 'POST',
    data,
  });
}

export function updateSavedQuery(organization, id, data) {
  const api = new Client();
  const endpoint = `/organizations/${organization.slug}/discover/saved/${id}/`;

  return api.requestPromise(endpoint, {
    method: 'PUT',
    data,
  });
}

export function deleteSavedQuery(organization, id) {
  const api = new Client();
  const endpoint = `/organizations/${organization.slug}/discover/saved/${id}/`;

  return api.requestPromise(endpoint, {
    method: 'DELETE',
  });
}
