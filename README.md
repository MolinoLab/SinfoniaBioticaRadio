# Sinfonia Biotica Radio

POC to stream influxDB data into sound using ToneJS library

## How to run

Add the necessary environment variables in a `.env` file:

```env
VITE_INFLUXDB_URL=your_influxdb_url
VITE_INFLUXDB_TOKEN=your_influxdb_token
```

Then, follow these steps:

1. Clone the repository
2. Install dependencies
   ```bash
   yarn i
   ```
3. Start the development server
   ```bash
    yarn dev
    ```

To build the project for production, run:
   ```bash
   yarn build
   ```
