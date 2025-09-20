/**
 * DiscountFunctionSettings.js
 *
 * Este archivo define la UI de configuración de la función de descuentos
 * para el Admin de Shopify. Permite a los administradores:
 *
 * 1. Configurar los porcentajes de descuento:
 *    - cartLinePercentage: % de descuento por producto (PRODUCT).
 *    - orderPercentage: % de descuento por total del carrito (IMPORTE).
 *    - deliveryPercentage: % de descuento sobre el envío.
 *
 * 2. Seleccionar a qué productos o colecciones se aplican los descuentos.
 *    - Se puede aplicar a todos los productos o a colecciones específicas.
 *    - Permite agregar y eliminar colecciones mediante un selector.
 *
 * 3. Guardar y cargar la configuración usando Metafields:
 *    - Namespace: $app:example-discounts--ui-extension
 *    - Key: function-configuration
 *
 * 4. Controlar la UI:
 *    - Mostrar campos de porcentaje y selector de colecciones.
 *    - Mostrar botones de agregar/eliminar colecciones.
 *    - Resetear los valores a la configuración previamente guardada.
 *
 * 5. Crear automáticamente el Metafield si no existe en Shopify.
 *
 * NOTA IMPORTANTE:
 * Este archivo solo gestiona la **interfaz de configuración** en Admin.
 * No realiza ningún cálculo de descuentos en el checkout.
 * La lógica de aplicar descuentos según la tabla de Prisma debe implementarse
 * en la Shopify Function principal (apply-discount-rules).
 */
import {
  FunctionSettings,
  Text,
  Form,
  NumberField,
  Box,
  BlockStack,
  Section,
  Button,
  InlineStack,
  Select,
  Link,
  Divider,
  extension,
} from '@shopify/ui-extensions/admin';

const TARGET = 'admin.discount-details.function-settings.render';
const METAFIELD_NAMESPACE = '$app:example-discounts--ui-extension';
const METAFIELD_KEY = 'function-configuration';

function parseMetafield(value) {
  try {
    const parsed = JSON.parse(value || '{}');
    return {
      cartLinePercentage: Number(parsed.cartLinePercentage ?? 0),
      orderPercentage: Number(parsed.orderPercentage ?? 0),
      deliveryPercentage: Number(parsed.deliveryPercentage ?? 0),
      collectionIds: parsed.collectionIds ?? [],
    };
  } catch (error) {
    console.error('Error parsing metafield', error);
    return {
      cartLinePercentage: 0,
      orderPercentage: 0,
      deliveryPercentage: 0,
      collectionIds: [],
    };
  }
}

export default extension(TARGET, async (root, api) => {
  let initialized = false;

  const { applyMetafieldChange, i18n, data, resourcePicker } = api;

  const initialValues = data?.metafields || [];
  const metafieldValue = initialValues.find(
    metafield => metafield.key === 'function-configuration'
  )?.value || '{}';

  let config = parseMetafield(metafieldValue);

  let collectionData = [];

  let targetingType = config.collectionIds?.length > 0 ? 'collections' : 'all';

  let loadingCollections = false;

  const functionSettingsComponent = root.createComponent(FunctionSettings, {
    onSave: saveSettings
  });

  const formComponent = root.createComponent(Form, {
    onReset: resetSettings
  });

  const mainSection = root.createComponent(Section, {});
  const loadingIndicator = root.createComponent(Text, {}, 'Loading...');

  const title = root.createComponent(
    Text,
    { size: 'medium', emphasis: 'bold' },
    i18n.translate('title') || 'Discount Configuration'
  );

  functionSettingsComponent.append(title);
  functionSettingsComponent.append(formComponent);
  formComponent.append(mainSection);
  root.append(functionSettingsComponent);

  initialize();

  async function initialize() {
    mainSection.append(loadingIndicator);

    try {
      if (config.collectionIds?.length > 0) {
        await fetchCollections();
      }
    } catch (error) {
      console.error('Error initializing', error);
    } finally {
      if (mainSection.children.includes(loadingIndicator)) {
        mainSection.removeChild(loadingIndicator);
      }

      buildUI();
      initialized = true;
    }
  }

  async function fetchCollections() {
    if (loadingCollections || !config.collectionIds?.length) return;

    loadingCollections = true;

    try {
      const query = `#graphql
        query GetCollections($ids: [ID!]!) {
          collections: nodes(ids: $ids) {
            ... on Collection {
              id
              title
            }
          }
        }
      `;

      const result = await api.query(query, {
        variables: { ids: config.collectionIds }
      });

      if (result?.data?.collections) {
        collectionData = result.data.collections
          .filter(collection => collection && collection.id)
          .map(collection => ({
            id: collection.id,
            title: collection.title || 'Unnamed Collection'
          }));
      }
    } catch (error) {
      console.error('Error fetching collections', error);
      collectionData = [];
    } finally {
      loadingCollections = false;
    }
  }

  function buildUI() {
    while (mainSection.children.length > 0) {
      mainSection.removeChild(mainSection.children[0]);
    }

    const content = root.createComponent(BlockStack, { gap: 'base' });

    const productField = root.createComponent(NumberField, {
      label: i18n.translate('percentage.Product') || 'Product Discount',
      value: config.cartLinePercentage,
      onChange: value => {
        config.cartLinePercentage = Number(value);
      },
      suffix: '%'
    });
    content.append(productField);

    const collectionsBox = root.createComponent(Box, {});
    const collectionsStack = root.createComponent(BlockStack, { gap: 'base' });

    const header = root.createComponent(InlineStack, {
      blockAlignment: 'end',
      gap: 'base'
    });

    const selector = root.createComponent(Select, {
      label: i18n.translate('collections.appliesTo') || 'Applies to',
      value: targetingType,
      onChange: value => {
        targetingType = value;

        if (value === 'all') {
          collectionData = [];
          config.collectionIds = [];
        }

        if (initialized) {
          buildUI();
        }
      },
      options: [
        {
          label: i18n.translate('collections.allProducts') || 'All products',
          value: 'all'
        },
        {
          label: i18n.translate('collections.collections') || 'Specific collections',
          value: 'collections'
        }
      ]
    });
    header.append(selector);

    if (targetingType === 'collections') {
      const addButton = root.createComponent(
        Box,
        { inlineSize: 180 },
        root.createComponent(Button, {
          onPress: openCollectionPicker
        }, i18n.translate('collections.buttonLabel') || 'Add collections')
      );
      header.append(addButton);
    }

    collectionsStack.append(header);

    if (targetingType === 'collections' && collectionData.length > 0) {
      collectionData.forEach(collection => {
        const row = root.createComponent(InlineStack, {
          blockAlignment: 'center',
          inlineAlignment: 'space-between'
        });

        let collectionId = '';
        try {
          const parts = collection.id.split('/');
          collectionId = parts[parts.length - 1] || '';
        } catch (err) {
          console.error('Error extracting collection ID', err);
        }

        const link = root.createComponent(
          Link,
          {
            url: `shopify://admin/collections/${collectionId}`,
            external: true
          },
          collection.title
        );


        const removeBtn = root.createComponent(
          Button,
          {
            kind: 'tertiary',
            onPress: () => removeCollection(collection.id)
          },
          "✕"
        );

        row.append(link);
        row.append(removeBtn);
        collectionsStack.append(row);
        collectionsStack.append(root.createComponent(Divider, {}));
      });
    }

    collectionsBox.append(collectionsStack);
    content.append(collectionsBox);

    if (targetingType === 'all' || collectionData.length === 0) {
      content.append(root.createComponent(Divider, {}));
    }

    const orderField = root.createComponent(NumberField, {
      label: i18n.translate('percentage.Order') || 'Order Discount',
      value: config.orderPercentage,
      onChange: value => {
        config.orderPercentage = Number(value);
      },
      suffix: '%'
    });
    content.append(orderField);

    const shippingField = root.createComponent(NumberField, {
      label: i18n.translate('percentage.Shipping') || 'Shipping Discount',
      value: config.deliveryPercentage,
      onChange: value => {
        config.deliveryPercentage = Number(value);
      },
      suffix: '%'
    });
    content.append(shippingField);

    mainSection.append(content);
  }

  function removeCollection(collectionId) {
    collectionData = collectionData.filter(c => c.id !== collectionId);
    config.collectionIds = collectionData.map(c => c.id);

    if (initialized) {
      buildUI();
    }
  }

  async function openCollectionPicker() {
    try {
      const selections = collectionData.map(c => ({ id: c.id }));

      const result = await resourcePicker({
        type: 'collection',
        selectionIds: selections,
        action: 'select',
        filter: {
          archived: true,
          variants: true
        }
      });

      if (result && Array.isArray(result)) {
        config.collectionIds = result.map(item => item.id);

        collectionData = result.map(item => ({
          id: item.id,
          title: item.title || 'Unnamed Collection'
        }));

        if (initialized) {
          buildUI();
        }
      }
    } catch (error) {
      console.error('Error with collection picker', error);
    }
  }

  function resetSettings() {
    config = parseMetafield(metafieldValue);
    targetingType = config.collectionIds?.length > 0 ? 'collections' : 'all';

    if (config.collectionIds?.length > 0) {
      fetchCollections().then(() => buildUI());
    } else {
      collectionData = [];
      buildUI();
    }
  }

  async function saveSettings() {
    try {
      await applyMetafieldChange({
        type: 'updateMetafield',
        namespace: METAFIELD_NAMESPACE,
        key: METAFIELD_KEY,
        value: JSON.stringify({
          cartLinePercentage: config.cartLinePercentage,
          orderPercentage: config.orderPercentage,
          deliveryPercentage: config.deliveryPercentage,
          collectionIds: config.collectionIds,
        }),
        valueType: 'json',
      });
    } catch (error) {
      console.error('Error saving settings', error);
    }
  }

  checkMetafieldDefinition();

  async function checkMetafieldDefinition() {
    const existingDefinition = await getMetafieldDefinition();
    if (!existingDefinition) {
      await createMetafieldDefinition();
    }
  }

  async function getMetafieldDefinition() {
    const query = `#graphql
      query GetMetafieldDefinition {
        metafieldDefinitions(first: 1, ownerType: DISCOUNT, namespace: "${METAFIELD_NAMESPACE}", key: "${METAFIELD_KEY}") {
          nodes {
            id
          }
        }
      }
    `;

    const result = await api.query(query);
    return result?.data?.metafieldDefinitions?.nodes[0];
  }

  async function createMetafieldDefinition() {
    const query = `#graphql
      mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
        metafieldDefinitionCreate(definition: $definition) {
          createdDefinition {
            id
          }
        }
      }
    `;

    const variables = {
      definition: {
        access: {
          admin: 'MERCHANT_READ_WRITE',
        },
        key: METAFIELD_KEY,
        name: 'Discount Configuration',
        namespace: METAFIELD_NAMESPACE,
        ownerType: 'DISCOUNT',
        type: 'json',
      }
    };

    await api.query(query, { variables });
  }
});


