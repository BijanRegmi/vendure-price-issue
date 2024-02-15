import {
    createTestEnvironment,
    registerInitializer,
    SqljsInitializer,
    testConfig,
} from "@vendure/testing";
import { DefaultLogger, LogLevel, mergeConfig } from "@vendure/core";
import path from "path";
import { OrderLinePlugin } from "../src/orderline.plugin";
import { initialData } from "./initial-data";

require("dotenv").config();

(async () => {
    registerInitializer("sqljs", new SqljsInitializer("__data__"));
    const devConfig = mergeConfig(testConfig, {
        logger: new DefaultLogger({ level: LogLevel.Debug }),
        plugins: [OrderLinePlugin],
        apiOptions: {
            shopApiPlayground: true,
            adminApiPlayground: true,
        },
    });
    const { server } = createTestEnvironment(devConfig);
    await server.init({
        initialData,
        productsCsvPath: path.join(__dirname, "./product-import.csv"),
        customerCount: 2
    });
})();
