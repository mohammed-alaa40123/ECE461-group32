import AWS from 'aws-sdk';
import jwt from 'jsonwebtoken';

const s3 = new AWS.S3();

// Mock user data for authentication
const users: Record<string, string> = {
    "ece30861defaultadminuser": "correcthorsebatterystaple123(!__+@**(A'\"`;DROP TABLE packages;"
};

const JWT_SECRET = 'your_jwt_secret_key'; // Use a strong secret key

// Simulate API Gateway event for local testing
const simulateEvent = (path: string, method: string, body?: string) => ({
    path,
    httpMethod: method,
    body,
    headers: {
        Authorization: undefined, // Set this when testing authenticated endpoints
    },
});

export const handler = async (event: any): Promise<any> => {
    const path = event.path;
    const httpMethod = event.httpMethod;

    try {
        // Middleware for token verification
        if (path !== '/authenticate') {
            const token = event.headers.Authorization?.split(' ')[1];
            const verifiedUser = verifyToken(token);
            if (!verifiedUser) {
                return {
                    statusCode: 401,
                    body: JSON.stringify({ error: 'Unauthorized' }),
                };
            }
        }

        switch (path) {
            case '/authenticate':
                if (httpMethod === 'POST') {
                    return await authenticate(event.body);
                }
                break;

            case '/packages':
                if (httpMethod === 'POST') {
                    return await uploadPackage(event.body);
                }
                break;

            case '/package':
                if (httpMethod === 'GET') {
                    return await getPackage(event);
                }
                break;

            default:
                return {
                    statusCode: 404,
                    body: JSON.stringify({ error: 'Endpoint not found' }),
                };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: (error as Error).message }),
        };
    }
};

const authenticate = async (body: string): Promise<any> => {
    const { username, password } = JSON.parse(body);

    if (users[username] && users[username] === password) {
        const token = jwt.sign({ username, isAdmin: true }, JWT_SECRET, { expiresIn: '1h' });
        return {
            statusCode: 200,
            body: JSON.stringify({ token }),
        };
    }

    return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid credentials' }),
    };
};

const verifyToken = (token: string | undefined): any => {
    if (!token) return null;

    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

const uploadPackage = async (body: string): Promise<any> => {
    const { fileContent, fileName } = JSON.parse(body);

    // Simulate S3 upload process
    console.log(`Uploading ${fileName}...`);
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'File uploaded successfully' }),
    };
};

const getPackage = async (event: any): Promise<any> => {
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Retrieve package logic not implemented yet.' }),
    };
};

// Test the handler locally
(async () => {
    // Test authentication
    const authEvent = simulateEvent('/authenticate', 'POST', JSON.stringify({
        username: "ece30861defaultadminuser",
        password: "correcthorsebatterystaple123(!__+@**(A'\"`;DROP TABLE packages;"
    }));
    const authResponse = await handler(authEvent);
    console.log('Authentication Response:', authResponse);

    const token = JSON.parse(authResponse.body).token;

    // Test upload package
    const uploadEvent = simulateEvent('/packages', 'POST', JSON.stringify({
        fileContent: "SGVsbG8gd29ybGQ=", // base64 for "Hello world"
        fileName: "hello.txt"
    }));
    uploadEvent.headers.Authorization = `Bearer ${token}`;
    const uploadResponse = await handler(uploadEvent);
    console.log('Upload Response:', uploadResponse);

    // Test get package
    const getEvent = simulateEvent('/package', 'GET');
    getEvent.headers.Authorization = `Bearer ${token}`;
    const getResponse = await handler(getEvent);
    console.log('Get Response:', getResponse);
})();
