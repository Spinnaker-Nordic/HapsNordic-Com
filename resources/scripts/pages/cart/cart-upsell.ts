import { ComponentType } from '@spinnakernordic/micro-components';

const Component: ComponentType = () => {
  const activateAddToCartButtons = () => {
    const addToCartButtons = document.querySelectorAll<HTMLButtonElement>(
      '[data-add-to-cart-button-upsell]'
    );
    addToCartButtons.forEach((oneButton) => {
      oneButton.addEventListener('click', () => {
        const productId = oneButton.getAttribute('product-id');
        const variantSelector = document.querySelector<HTMLSelectElement>(
          `.upsell-variant-selector[product-id="${productId}"]`
        );
        const variantId = variantSelector.value;

        const variant = {
          id: variantId,
          quantity: 1,
        };

        document.dispatchEvent(new CustomEvent('cart:add:variant', { detail: variant }));
      });
    });

    const variantSelectors = document.querySelectorAll<HTMLSelectElement>(
      '.upsell-variant-selector'
    );
    variantSelectors.forEach((oneSelector) => {
      oneSelector.addEventListener('change', (event: Event & { target: HTMLSelectElement }) => {
        const price = event.target.options[event.target.selectedIndex].getAttribute('price');
        const productId = event.target.getAttribute('product-id');
        document.querySelector<HTMLSelectElement>(
          `.upsell-variant-price[product-id="${productId}"]`
        ).innerHTML = price;
      });
    });
  };

  const updateUpsells = async (cart) => {
    const { default: scrollLock } = await import(
      /* webpackChunkName: "scrolllock" */ 'modules/scrolllock'
    );

    const scrollableContainers = document.querySelectorAll<HTMLElement>('[data-scrollable-upsell]');
    const deviceWidth = window.innerWidth;
    if (deviceWidth < 1024) {
      document.addEventListener('cart-drawer:open', () => {
        scrollLock.lock([...scrollableContainers]);
      });
    }

    if (cart.items.length) {
      const productHandle = cart.items[0].handle;

      await fetch(`/products/${productHandle}?view=upsell`)
        .then((response) => response.text())
        .then((data) => {
          const parser = new DOMParser();
          const allPage = parser.parseFromString(data, 'text/html');
          const upsellPart = allPage.querySelector('.product-upsells');

          if (deviceWidth < 1024) {
            document.querySelector('.cart-upsell__mobile .cart-upsell__body').innerHTML = '';
            document
              .querySelector('.cart-upsell__mobile .cart-upsell__body')
              .appendChild(upsellPart);
            document
              .querySelector<HTMLElement>('.cart-upsell__mobile')
              .classList.remove('opacity-0', 'invisible');

            const cartToggleButtons = document.querySelectorAll('[data-toggle="cart-drawer"]');
            cartToggleButtons.forEach((button) => {
              button.addEventListener('click', () => {
                setTimeout(() => {
                  const cartDrawer = document.querySelector<HTMLElement>('.cart-drawer.drawer');
                  if (cartDrawer.classList.contains('drawer--active')) {
                    scrollLock.lock([...scrollableContainers]);
                  } else {
                    scrollLock.unlock([...scrollableContainers]);
                  }
                }, 300);
              });
            });
          } else {
            document
              .querySelector<HTMLElement>('.cart-upsell__desktop .cart-upsell__body')
              .classList.add('opacity-0', 'invisible');
            document.querySelector('.cart-upsell__desktop .cart-upsell__body').innerHTML = '';
            document
              .querySelector('.cart-upsell__desktop .cart-upsell__body')
              .appendChild(upsellPart);
            setTimeout(() => {
              document
                .querySelector<HTMLElement>('.cart-upsell__desktop .cart-upsell__body')
                .classList.remove('opacity-0', 'invisible');
              document
                .querySelector<HTMLElement>('.cart-upsell__desktop')
                .classList.remove('opacity-0', 'invisible');
            }, 1000);
          }
          activateAddToCartButtons();
        });
    } else {
      document
        .querySelector<HTMLElement>('.cart-upsell__mobile')
        .classList.add('opacity-0', 'invisible');
      document
        .querySelector<HTMLElement>('.cart-upsell__desktop')
        .classList.add('opacity-0', 'invisible');
    }
  };

  const renderUpsellsWhenPageLoad = async () => {
    await fetch(`${Shopify.routes.root}cart.js`, {
      method: 'GET',
    })
      .then((res) => res.json())
      .then((data) => {
        updateUpsells(data);
      });
  };

  renderUpsellsWhenPageLoad();

  document.addEventListener('cart:updated', (event: CustomEvent) => {
    updateUpsells(event.detail);
  });
};

export default Component;
