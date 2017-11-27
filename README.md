# Hull Close.io Connector

Synchronize accounts and users from Hull to leads and contacts in close.io.

## Installation

- Go to your `Hull Dashboard`, navigate to `Connectors` and click on `+ Add Connector`
- Select the Close.io Connector from the list, or use your own heroku deployment

## Usage

See [user documentation](/assets/readme.md) for details how to use this Connector.

## Logs

The following logs are created by this connector that are not documented in the standard guide:

- `connector.metadata.error`: Logged when the connector cannot retrieve metadata such as custom fields or lead statuses.
- `connector.auth.error`: Logged when the authentication with the close.io API fails.
