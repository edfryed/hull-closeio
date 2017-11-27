import { IMetricsClient } from "../../server/lib/shared";


export class MetricsClientMock implements IMetricsClient {
  increment(name: string, value: number = 1) { // eslint-disable-line class-methods-use-this
    console.log(`Metric ${name} incremented by ${value}`);
  }

  value(name: string, value: number = 1) { // eslint-disable-line class-methods-use-this
    console.log(`Metric ${name} value set to ${value}`);
  }
}

export default { MetricsClientMock };