import {
    Ctx,
    ID,
    OrderItemPriceCalculationStrategy,
    OrderLine,
    OrderService,
    PluginCommonModule,
    PriceCalculationResult,
    ProductVariant,
    RequestContext,
    TransactionalConnection,
    VendurePlugin,
} from "@vendure/core";
import { Resolver, Args, Mutation } from "@nestjs/graphql";
import gql from "graphql-tag";

declare module "@vendure/core" {
    interface CustomOrderLineFields {
        discount: number;
    }
}

export class OrderLinePriceCalculationWithDiscount
    implements OrderItemPriceCalculationStrategy {
    calculateUnitPrice(
        _ctx: RequestContext,
        productVariant: ProductVariant,
        orderLineCustomFields: OrderLine["customFields"],
    ): PriceCalculationResult | Promise<PriceCalculationResult> {
        const newPrice = productVariant.listPrice - orderLineCustomFields.discount;
        console.log({ price: newPrice, discount: orderLineCustomFields.discount });
        return {
            price: newPrice,
            priceIncludesTax: productVariant.listPriceIncludesTax,
        };
    }
}

@Resolver()
class OrderLineResolver {
    constructor(
        private connection: TransactionalConnection,
        private orderService: OrderService,
    ) { }

    @Mutation()
    async setDiscount(
        @Ctx() ctx: RequestContext,
        @Args() args: { orderLineId: ID; discount: number },
    ) {
        const { orderLineId, discount } = args;

        const orderLine = await this.connection
            .getRepository(ctx, OrderLine)
            .findOne({
                where: { id: orderLineId },
                relations: {
                    order: true,
                    productVariant: { taxCategory: true, productVariantPrices: true },
                    taxCategory: true,
                },
            });
        if (!orderLine) return;

        orderLine.customFields.discount = discount;
        const savedOrderLine = await this.connection
            .getRepository(ctx, OrderLine)
            .save(orderLine);

        const order = await this.orderService.findOne(ctx, orderLine.order.id);
        if (!order) return;

        // ISSUE:
        // Even after updating the orderLine discount customField
        // the orderLine price still remains the same
        const updatedOrder = await this.orderService.applyPriceAdjustments(
            ctx,
            order,
            [savedOrderLine],
        );
        return updatedOrder;
    }
}

@VendurePlugin({
    imports: [PluginCommonModule],
    shopApiExtensions: {
        schema: gql`
      extend type Mutation {
        setDiscount(orderLineId: ID!, discount: Int!): Order
      }
    `,
        resolvers: [OrderLineResolver],
    },
    configuration: (config) => {
        config.customFields.OrderLine.push({
            name: "discount",
            type: "int",
            defaultValue: 0,
            public: true,
        });

        config.orderOptions.orderItemPriceCalculationStrategy =
            new OrderLinePriceCalculationWithDiscount();

        return config;
    },
})
export class OrderLinePlugin { }
