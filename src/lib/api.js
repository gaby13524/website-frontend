import { camelCase, isArray, keyBy } from "lodash";
import { fromStateMap } from "./stateToRedux";
import { crossProduct } from "./utils";

const toObject = (obj, [resource, method, func]) => {
  obj[resource]
    ? (obj[resource][method] = func)
    : (obj[resource] = { [method]: func });
  return obj;
};

/**
 * @typedef {(data:{id?}, options?:{query})=>Promise<Response>} ApiCall
 *
 */

/**
 * @param {string} baseURL the base url for the api
 * @param {{[resource:string]:any}} stateMap object with api resourceNames as keys
 * @param { import("react").Dispatch} dispatch redux dispatch for the redux store
 * @returns {{[resource:string]:
 *  {
 *   create: ApiCall,
 *   read: ApiCall,
 *   get: ApiCall,
 *   update: ApiCall,
 *   delete: ApiCall
 * }]}} api
 *
 * @description
 * ApiFactory is based on the specifications of RESTful (rails like) apis.
 *
 * the apiFactory takes a stateMap like the one used in stateToRedux, and returns
 * crud commands for each of the resources in the map.
 *
 * if the user includes a data object with an id in their crud command, the id will
 * be appended to the url. So api.book.get({id:32}) should retrieve the book with
 * id 32.
 *
 * The tool does not work with nested resources.
 */

export const apiFactory = (baseURL, stateMap, dispatch) => {
  const { actions } = fromStateMap(stateMap);
  const methods = {
    create: "post",
    read: "get",
    get: "get",
    update: "patch",
    delete: "delete",
  };
  /**
   *
   * @param {string} resourceName the name of the resource. Usually generated by the apiFactory
   * @param {string} method the name of the method, generated internally by the apiFactory
   * @returns {ApiCall}
   */
  const requestFactory = (resourceName, method) => async (
    data,
    userOptions
  ) => {
    const id = data?.id;
    if (method === "post" && id)
      throw "can't post with an id. Id creation is the responsibility of the backend";

    if (["patch", "delete"].includes(method) && id === undefined) {
      throw `missing id in call:
       resource: ${resourceName}
       method: ${method}`;
    }
    const url = [baseURL, resourceName, id || ""].join("/");
    let options = {
      method,
      headers: {
        Authorization: "Bearer " + localStorage.authToken,
      },
      json: true,
    };
    const body = JSON.stringify(data);
    if (!method === "get") options.body = body;

    return dispatch({
      type: `${method}_${resourceName}`.toUpperCase(),
      payload: (await fetch(url, options)).json(),
    }).then(({ value }) => {
      isArray(value) && (value = keyBy(value, "id"));
      const key = camelCase("update_" + resourceName);
      return dispatch(actions[key](value));
    });
  };

  const resourceNames = Object.keys(stateMap);

  /**
   * an api is basically a list of (method, resource, data?)=>Response
   * functions. Curried, that becomes (method, resource) =>data?=>Response
   *
   * The code below gets the (method, resource) part from the crossProduct
   * of the methods and resources given to the function.
   *
   * it uses the request factory to turn those into a function that returns a
   * request.
   *
   * The toObject reducer simply structures that list in a nice ui.
   */

  const api = crossProduct(resourceNames, Object.keys(methods))
    .map(([resource, method]) => [
      resource,
      method,
      requestFactory(resource, methods[method]),
    ])
    .reduce(toObject, {});
  return api;
};