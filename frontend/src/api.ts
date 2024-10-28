import axios from 'axios';

const API_BASE_URL = 'localhost:4000/dev';
const authToken = localStorage.getItem('authToken');


export const authenticateUser = async (username: string, password: string, isAdministrator: boolean) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/authenticate`,
      {
        User: {
          name: username,
          isAdmin: isAdministrator,
        },
        Secret: {
          password,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    if (response.status === 200) {
      return response.data;
    } else if (response.status === 400) {
      throw new Error('There is missing field(s) in the AuthenticationRequest or it is formed improperly.');
    } else if (response.status === 401) {
      throw new Error('The user or password is invalid.');
    } else if (response.status === 501) {
      throw new Error('This system does not support authentication.');
    } else {
        throw new Error('An unknown error occurred.');
    }
  } catch (error) {
    console.log(error);
  }
};

export const getPackages = async (queryParams?: object, offset?: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/packages`,
      queryParams,
      {
        params: { offset },
        headers: {
          'X-Authorization': authToken,
          'Content-Type': 'application/json',
        },
      }
    );
    if (response.status === 200) {
      console.log('Packages retrieved successfully.');
      return response.data;
    } else if (response.status === 400) {
      throw new Error('There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.');
    } else if (response.status === 403) {
      throw new Error('Authentication failed due to invalid or missing AuthenticationToken.');
    } else if (response.status === 413) {
      throw new Error('Too many packages returned.');
    } else {
      throw new Error('An unknown error occurred.');
    }
  } catch (error) {
    console.log(error);
  }
};

export const getPackageById = async (packageId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/package/${packageId}`);
    if (response.status === 200) {
      return response.data;
    } else if (response.status === 400) {
      throw new Error('There is missing field(s) in the PackageID or it is formed improperly, or is invalid.');
    } else if (response.status === 403) {
      throw new Error('Authentication failed due to invalid or missing AuthenticationToken.');
    } else if (response.status === 404) {
      throw new Error('Package does not exist.');
    } else {
      throw new Error('An unknown error occurred.');
    }
  } catch (error) {
    console.log(error);
  }
};

export const updatePackageById = async (packageId: string, packageData: object) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/package/${packageId}`,
      packageData,
      {
        headers: {
          'X-Authorization': authToken,
          'Content-Type': 'application/json',
        },
      }
    );
    if (response.status === 200) {
      console.log('Version is updated.');
      return response.data;
    } else if (response.status === 400) {
      throw new Error('There is missing field(s) in the PackageID or it is formed improperly, or is invalid.');
    } else if (response.status === 403) {
      throw new Error('Authentication failed due to invalid or missing AuthenticationToken.');
    } else if (response.status === 404) {
      throw new Error('Package does not exist.');
    } else {
      throw new Error('An unknown error occurred.');
    }
  } catch (error) {
    console.log(error);
  }
};

export const resetRegistry = async (authToken: string) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/reset`, {
      headers: {
        'X-Authorization': authToken,
      },
    });
    if (response.status === 200) {
      console.log('Registry is reset.');
      return response.data;
    } else if (response.status === 401) {
      throw new Error('You do not have permission to reset the registry.');
    } else if (response.status === 403) {
      throw new Error('Authentication failed due to invalid or missing AuthenticationToken.');
    } else {
      throw new Error('An unknown error occurred.');
    }
  } catch (error) {
    console.log(error);
  }
};

export const getPackageRate = async (packageId: string, authToken: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/package/${packageId}/rate`, {
      headers: {
        'X-Authorization': authToken,
      },
    });
    if (response.status === 200) {
      return response.data;
    } else if (response.status === 400) {
      throw new Error('There is missing field(s) in the PackageID');
    } else if (response.status === 403) {
      throw new Error('	Authentication failed due to invalid or missing AuthenticationToken.');
    } else if (response.status === 404) {
      throw new Error('Package does not exist.');
    } else if (response.status === 500) {
      throw new Error('The package rating system choked on at least one of the metrics.');
    } else {
      throw new Error('An unknown error occurred.');
    }
  } catch (error) {
    console.log(error);
  }
};

export const getPackageCost = async (packageId: string, dependency: boolean, authToken: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/package/${packageId}/cost`, {
      params: { dependency },
      headers: {
        'X-Authorization': authToken,
      },
    });
    if (response.status === 200) {
      return response.data;
    } else if (response.status === 400) {
      throw new Error('There is missing field(s) in the PackageID');
    } else if (response.status === 403) {
      throw new Error('Authentication failed due to invalid or missing AuthenticationToken.');
    } else if (response.status === 404) {
      throw new Error('Package does not exist.');
    } else if (response.status === 500) {
      throw new Error('The package rating system choked on at least one of the metrics.');
    } else {
      throw new Error('An unknown error occurred.');
    }
  } catch (error) {
    console.log(error);
  }
};

export const searchPackagesByRegEx = async (regex: string, authToken: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/package/byRegEx`,
      { RegEx: regex },
      {
        headers: {
          'X-Authorization': authToken,
          'Content-Type': 'application/json',
        },
      }
    );
    if (response.status === 200) {
      return response.data;
    } else if (response.status === 400) {
      throw new Error('There is missing field(s) in the PackageRegEx or it is formed improperly, or is invalid');
    } else if (response.status === 403) {
      throw new Error('Authentication failed due to invalid or missing AuthenticationToken.');
    } else if (response.status === 404) {
      throw new Error('No package found under this regex.');
    } else {
      throw new Error('An unknown error occurred.');
    }
  } catch (error) {
    console.log(error);
  }
};

export const getTracks = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/tracks`);
    if (response.status === 200) {
      console.log('Tracks retrieved successfully.');
      return response.data;
    } else if (response.status === 500) {
      throw new Error('The system encountered an error while retrieving the student\'s track information.');
    } else {
      throw new Error('An unknown error occurred.');
    }
  } catch (error) {
    console.log(error);
  }
};
