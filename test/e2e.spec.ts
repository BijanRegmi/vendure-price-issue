import { mergeConfig } from "@vendure/core";
import {
    createTestEnvironment,
    registerInitializer,
    SqljsInitializer,
    testConfig,
} from "@vendure/testing";
import { it, describe, afterAll, expect, beforeAll } from "vitest";
import { OrderLinePlugin } from "../src/orderline.plugin";
import { initialData } from "./initial-data";
import path from "path";
import { GetCustomerListDocument } from "./graphql/generated-admin-types";
import {
    AddProductToOrderDocument,
    GetActiveOrderDocument,
    SetDiscountDocument,
} from "./graphql/generated-shop-types";
import util from "util";

require("dotenv").config();

function log(obj: object) {
    console.log(util.inspect(obj, false, null, true));
}

registerInitializer("sqljs", new SqljsInitializer("__data__"));
describe("Orderline Plugin", function() {
    let email = "";
    const config = mergeConfig(testConfig, {
        plugins: [OrderLinePlugin],
    });
    const { server, adminClient, shopClient } = createTestEnvironment(config);

    beforeAll(async () => {
        await server.init({
            initialData,
            productsCsvPath: path.join(__dirname, "./product-import.csv"),
            customerCount: 3,
        });
        await adminClient.asSuperAdmin();

        email = await adminClient
            .query(GetCustomerListDocument, {
                options: { take: 1 },
            })
            .then((c) => c.customers.items[0].emailAddress);
    }, 60000);

    it("Should update orderLine price", async () => {
        await shopClient.asUserWithCredentials(email, "test");
        const addProductResult = await shopClient
            .query(AddProductToOrderDocument, {
                productVariantId: "T_1",
                quantity: 1,
            })
            .then((res) => res.addItemToOrder);

        expect(addProductResult.__typename).toBe("Order");
        if (addProductResult.__typename !== "Order") return;
        expect(addProductResult.lines).toHaveLength(1);
        expect(addProductResult.lines[0].unitPrice).toBe(129900);

        const orderLineId = addProductResult.lines[0].id;

        const setDiscountResult = await shopClient.query(SetDiscountDocument, {
            discount: 5000,
            orderLineId: orderLineId,
        });
        expect(setDiscountResult.setDiscount?.lines).toHaveLength(1);

        const order = await shopClient
            .query(GetActiveOrderDocument)
            .then((res) => res.activeOrder);
        log(order!);

        expect(order!.lines[0].unitPrice).toBe(129900 - 5000);
    });

    afterAll(() => {
        return server.destroy();
    });
});
