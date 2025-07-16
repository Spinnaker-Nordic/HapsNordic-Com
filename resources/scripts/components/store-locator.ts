import type { ComponentType } from '@spinnakernordic/micro-components';
import clear from '@utils/clear';

const Component: ComponentType = async (node) => {
  const config = JSON.parse(node.querySelector('[data-stores]').innerHTML);
  const { stores } = config;
  let storeFilter = '';

  const countryInput = node.querySelector<HTMLSelectElement>('[data-country]');
  const cityTextInput = node.querySelector<HTMLInputElement>('[data-city]');
  const filterButtons = node.querySelectorAll<HTMLElement>('[data-filter]');
  const storeView = node.querySelector<HTMLElement>('[data-store-view]');

  const regionNames = new Intl.DisplayNames([window.Shopify.locale], { type: 'region' });
  const allUniqueCountries = [
    ...new Set(
      stores
        .flatMap((entry) => (entry.country_code ? entry.country_code.trim() : null))
        .filter((n) => n)
    ),
  ].sort((a: string, b: string) => regionNames.of(a).localeCompare(regionNames.of(b)));

  const initGoogleMap = async (storeList: any) => {
    const { Map, InfoWindow } = (await google.maps.importLibrary(
      'maps'
    )) as google.maps.MapsLibrary;
    const { AdvancedMarkerElement, PinElement } = (await google.maps.importLibrary(
      'marker'
    )) as google.maps.MarkerLibrary;

    let firstLatitude = parseFloat(stores[0].latitude);
    let firstLongitude = parseFloat(stores[0].longitude);

    if (storeList.length) {
      if (storeList[0].latitude && storeList[0].longitude) {
        firstLatitude = parseFloat(storeList[0].latitude);
        firstLongitude = parseFloat(storeList[0].longitude);
      } else {
        storeList.forEach((store: any) => {
          if (store.latitude && store.longitude) {
            firstLatitude = parseFloat(store.latitude);
            firstLongitude = parseFloat(store.longitude);
          }
        });
      }
    }

    const map = new Map(document.getElementById('retailerMap') as HTMLElement, {
      center: { lat: firstLatitude, lng: firstLongitude },
      zoom: 7,
      mapId: '4504f8b37365c3d0',
    });

    google.maps.event.addListener(map, 'bounds_changed', () => {
      const bounds = map.getBounds();
      const zoomStoreList = [];
      storeList.forEach((store: any, i) => {
        const position = { lat: parseFloat(store.latitude), lng: parseFloat(store.longitude) };
        const renderedElement = document.querySelector<HTMLSelectElement>(
          `.store-list-item[data-company="${store.company}"][data-latitude="${store.latitude}"]`
        );
        if (renderedElement) {
          if (bounds.contains(position)) {
            zoomStoreList.push(store);
            renderedElement.classList.remove('hidden');
          } else {
            renderedElement.classList.add('hidden');
          }
        }
      });
    });

    // Create an info window to share between markers.
    const infoWindow = new InfoWindow();

    // Create the markers.
    storeList.forEach((store: any, i) => {
      if (store.latitude && store.longitude) {
        const position = { lat: parseFloat(store.latitude), lng: parseFloat(store.longitude) };
        const title = store.company;

        const beachFlagImg = document.createElement('img');
        beachFlagImg.src =
          'https://cdn.shopify.com/s/files/1/0072/7138/3110/files/map-marker-dark.png?v=1613735581';
        beachFlagImg.style.width = '30px';
        beachFlagImg.style.width = '30px';

        const marker = new AdvancedMarkerElement({
          position,
          map,
          title,
          content: beachFlagImg,
        });

        const modalContent = `<div class="store-locator-modal" style="min-width:280px;"><div class="store-locator-modal__main"><div class="store-locator-modal__left"><div class=""><h3>${
          store.company ? store.company : ''
        }</h3></div><p>${store.address ? store.address : ''}<br>${
          store.zipcode ? store.zipcode : ''
        } ${store.city ? store.city : ''}</p><p></div><div class="store-locator-modal__right">${
          store.website
            ? `<a target="_blank" href="https://${store.website}">` +
              `<svg width="21px" height="26px" viewBox="0 0 21 21" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">` +
              `<g id="Symbols" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">` +
              `<g id="forhandler" transform="translate(-267.000000, -56.000000)">` +
              `<g id="web-icon" transform="translate(264.000000, 52.000000)">` +
              `<rect id="Rectangle" x="0" y="10" width="28" height="28"></rect>` +
              `<g opacity="0.595108696" stroke-width="1" fill-rule="evenodd" transform="translate(3.000000, 4.000000)" id="Shape" fill="#243553">` +
              `<path d="M18.3525517,17.4596897 C19.9977931,15.6055345 21,13.1680862 21,10.5 C21,7.72401724 19.9152414,5.19822414 18.1497931,3.31872414 C18.1497931,3.31872414 18.1497931,3.31836207 18.1497931,3.31836207 C18.1483448,3.31618966 18.1461724,3.31546552 18.1450862,3.31365517 C16.3061379,1.35884483 13.7296552,0.107534483 10.8638793,0.0094137931 L10.8635172,0.00905172414 L10.6589483,0.00362068966 C10.6060862,0.00181034483 10.5532241,0 10.5,0 C10.4467759,0 10.3939138,0.00181034483 10.3410517,0.00362068966 L10.1372069,0.00905172414 L10.1368448,0.0094137931 C7.27106897,0.107534483 4.69458621,1.35884483 2.85563793,3.31365517 C2.85418966,3.31546552 2.85201724,3.31618966 2.85093103,3.31836207 C2.85093103,3.31836207 2.85093103,3.31872414 2.85056897,3.31908621 C1.08475862,5.19822414 0,7.72401724 0,10.5 C0,13.1680862 1.0022069,15.6055345 2.64744828,17.4596897 C2.64962069,17.4629483 2.64962069,17.466569 2.65215517,17.4698276 C2.65867241,17.4788793 2.66808621,17.4832241 2.67496552,17.4915517 C4.52368966,19.5582414 7.1762069,20.889569 10.1364828,20.9909483 L10.1368448,20.9913103 L10.3406897,20.9967414 C10.3939138,20.9981897 10.4467759,21 10.5,21 C10.5532241,21 10.6060862,20.9981897 10.6589483,20.9963793 L10.8627931,20.9909483 L10.8631552,20.9905862 C13.8266897,20.8888448 16.4821034,19.5549828 18.3308276,17.4839483 C18.3355345,17.4777931 18.3431379,17.4759828 18.3474828,17.4694655 C18.3503793,17.466569 18.3503793,17.4629483 18.3525517,17.4596897 Z M0.733189655,10.862069 L5.07910345,10.862069 C5.12001724,12.3968793 5.41981034,13.8882414 5.9535,15.2854655 C4.92377586,15.6580345 3.93931034,16.1576897 3.01675862,16.7811724 C1.66008621,15.167431 0.815741379,13.1105172 0.733189655,10.862069 Z M3.21444828,3.99108621 C4.11527586,4.57691379 5.07439655,5.04615517 6.0747931,5.39663793 C5.46217241,6.88365517 5.12327586,8.48689655 5.07910345,10.137931 L0.733189655,10.137931 C0.819724138,7.78194828 1.74227586,5.63668966 3.21444828,3.99108621 Z M20.2668103,10.137931 L15.9208966,10.137931 C15.8767241,8.48689655 15.5378276,6.88365517 14.9252069,5.39663793 C15.9256034,5.04615517 16.8847241,4.57691379 17.7855517,3.99108621 C19.2577241,5.63668966 20.1802759,7.78194828 20.2668103,10.137931 Z M10.137931,5.41763793 C9.09118966,5.38794828 8.06363793,5.23189655 7.07084483,4.95310345 C7.80475862,3.44762069 8.841,2.08877586 10.137931,0.957310345 L10.137931,5.41763793 Z M10.137931,6.14177586 L10.137931,10.137931 L5.80324138,10.137931 C5.84777586,8.56365517 6.17798276,7.03681034 6.76851724,5.62112069 C7.85689655,5.93648276 8.98691379,6.111 10.137931,6.14177586 Z M10.862069,6.14177586 C12.0130862,6.111 13.1431034,5.93684483 14.2318448,5.62112069 C14.8223793,7.03681034 15.1525862,8.56365517 15.1971207,10.137931 L10.862069,10.137931 L10.862069,6.14177586 Z M10.862069,5.41763793 L10.862069,0.957310345 C12.159,2.08877586 13.1952414,3.44762069 13.9291552,4.95310345 C12.9363621,5.23189655 11.9088103,5.38794828 10.862069,5.41763793 Z M14.6308448,4.73296552 C13.9353103,3.27563793 12.9700345,1.94793103 11.7748448,0.809948276 C13.8951207,1.0872931 15.8028621,2.04605172 17.2721379,3.45956897 C16.437931,3.98891379 15.5530345,4.4147069 14.6308448,4.73296552 Z M6.36915517,4.73296552 C5.44696552,4.4147069 4.56206897,3.98891379 3.72822414,3.45956897 C5.19713793,2.04605172 7.10524138,1.0872931 9.22551724,0.809948276 C8.02996552,1.94793103 7.06468966,3.27563793 6.36915517,4.73296552 Z M5.80324138,10.862069 L10.137931,10.862069 L10.137931,14.4965172 C8.94056897,14.5283793 7.76746552,14.7152069 6.63998276,15.0544655 C6.13055172,13.7311034 5.84415517,12.3172241 5.80324138,10.862069 Z M10.137931,15.2206552 L10.137931,20.0426897 C8.74975862,18.831569 7.66137931,17.3601207 6.92131034,15.7279138 C7.95936207,15.4219655 9.03760345,15.2517931 10.137931,15.2206552 Z M10.862069,20.0426897 L10.862069,15.2206552 C11.9623966,15.251431 13.0406379,15.4219655 14.0786897,15.7275517 C13.3386207,17.3601207 12.2502414,18.831569 10.862069,20.0426897 Z M10.862069,14.4965172 L10.862069,10.862069 L15.1967586,10.862069 C15.1558448,12.3172241 14.8694483,13.7311034 14.3596552,15.0548276 C13.2325345,14.7152069 12.059431,14.5283793 10.862069,14.4965172 Z M15.9208966,10.862069 L20.2668103,10.862069 C20.1842586,13.1105172 19.3402759,15.167431 17.9832414,16.7811724 C17.0606897,16.1576897 16.0762241,15.6580345 15.0465,15.2854655 C15.5805517,13.8882414 15.8799828,12.3968793 15.9208966,10.862069 Z M3.50881034,17.3235517 C4.36546552,16.7543793 5.27751724,16.2967241 6.23048276,15.954569 C6.9347069,17.5331897 7.94560345,18.9716897 9.22515517,20.1900517 C6.99806897,19.8985862 5.00487931,18.8558276 3.50881034,17.3235517 Z M11.7748448,20.1900517 C13.0543966,18.9720517 14.0652931,17.5335517 14.7695172,15.954569 C15.7224828,16.2967241 16.6341724,16.7543793 17.4911897,17.3235517 C15.9951207,18.8558276 14.001931,19.8985862 11.7748448,20.1900517 Z" fill-rule="nonzero"></path>` +
              `</g></g></g></g>` +
              `</svg>` +
              `</a>`
            : ''
        }${
          store.address && store.zipcode && store.city
            ? `<a target="_blank" href="https://maps.google.com?daddr=${store.address} ${store.zipcode} ${store.city}">` +
              `<svg width="20px" height="32px" viewBox="0 0 20 27" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">` +
              `<g id="Symbols" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">` +
              `<g id="forhandler" transform="translate(-268.000000, -15.000000)">` +
              `<g id="pin" transform="translate(264.000000, 14.000000)">` +
              `<g>` +
              `<rect id="Rectangle" x="0" y="10" width="28" height="28"></rect>` +
              `<g id="Group-2" opacity="0.625962409" transform="translate(4.000000, 1.000000)" fill-rule="nonzero" fill="#243553">` +
              `<path d="M9.68870679,25.5433245 L16.877671,14.9715697 C18.0455515,13.4489791 18.6875,11.5946225 18.6875,9.64309211 C18.6875,4.76714389 14.6870848,0.8125 9.75,0.8125 C4.81291523,0.8125 0.8125,4.76714389 0.8125,9.64309211 C0.8125,11.5713926 1.43919175,13.4050236 2.58152485,14.9179522 L9.68870679,25.5433245 Z M0,9.64309211 C0,4.31630626 4.36626351,0 9.75,0 C15.1337365,0 19.5,4.31630626 19.5,9.64309211 C19.5,11.7752076 18.7980241,13.8029614 17.5359639,15.4472453 L9.68312936,26.9964885 L1.92602262,15.3981602 C0.68270952,13.7473468 0,11.7458355 0,9.64309211 Z M9.75,12.1019737 C8.37991622,12.1019737 7.26736111,11.002148 7.26736111,9.64309211 C7.26736111,8.28403617 8.37991622,7.18421053 9.75,7.18421053 C11.1200838,7.18421053 12.2326389,8.28403617 12.2326389,9.64309211 C12.2326389,11.002148 11.1200838,12.1019737 9.75,12.1019737 Z M9.75,11.2894737 C10.6734321,11.2894737 11.4201389,10.5513104 11.4201389,9.64309211 C11.4201389,8.7348738 10.6734321,7.99671053 9.75,7.99671053 C8.82656794,7.99671053 8.07986111,8.7348738 8.07986111,9.64309211 C8.07986111,10.5513104 8.82656794,11.2894737 9.75,11.2894737 Z" id="Combined-Shape"></path>` +
              `</g>` +
              `</g>` +
              `</g>` +
              `</g>` +
              `</g>` +
              `</svg>` +
              `</a>`
            : ''
        }</div></div>`;

        // Add a click listener for each marker, and set up the info window.
        marker.addListener('click', ({ domEvent, latLng }) => {
          const { target } = domEvent;
          infoWindow.close();
          infoWindow.setContent(modalContent);
          infoWindow.open(marker.map, marker);
        });
      }
    });
  };

  let countryCode = 'DK';
  countryCode = document.querySelector<HTMLSelectElement>('.country-code-selector')?.textContent;
  countryCode = countryCode.replace(/\s/g, '');
  const danmarkStores = stores.filter((store: any) => store.country_code === countryCode);
  initGoogleMap(danmarkStores);

  const renderCountries = () => {
    clear(countryInput.querySelector('optgroup'));
    allUniqueCountries.forEach((country_code: string) => {
      countryInput.querySelector('optgroup').insertAdjacentHTML(
        'beforeend',
        `
        <option value="${country_code}" ${
          country_code.toLocaleLowerCase() === window.Shopify.country.toLocaleLowerCase()
            ? 'selected'
            : ''
        }>${regionNames.of(country_code)}</option>
      `
      );
    });
  };

  const renderFilteredView = ({
    country,
    searchTerms,
    filter,
  }: {
    filter: string;
    country: string;
    searchTerms: string;
  }) => {
    let filteredStores = [];
    let isGlobalSelected = false;

    if (country === 'global') {
      isGlobalSelected = true;

      allUniqueCountries.forEach((uniqueCountry) => {
        filteredStores.push({
          country_code: uniqueCountry,
          stores: stores.filter((store) => store.country_code === uniqueCountry),
        });
      });
    } else {
      filteredStores = [
        { country_code: country, stores: stores.filter((store) => store.country_code === country) },
      ];
    }

    if (searchTerms !== '') {
      filteredStores = [];

      if (country === 'global') {
        allUniqueCountries.forEach((uniqueCountry) => {
          filteredStores.push({
            country_code: uniqueCountry,
            stores: stores.filter((store) => {
              if (store.country_code === uniqueCountry)
                return (
                  store.zipcode?.toLowerCase().startsWith(searchTerms.toLowerCase()) ||
                  store.city?.toLowerCase().startsWith(searchTerms.toLowerCase())
                );
              return false;
            }),
          });
        });
      } else {
        filteredStores.push({
          country_code: country,
          stores: stores.filter((store) => {
            if (store.country_code === country)
              return (
                store.zipcode?.toLowerCase().startsWith(searchTerms.toLowerCase()) ||
                store.city?.toLowerCase().startsWith(searchTerms.toLowerCase())
              );
            return false;
          }),
        });
      }
    }

    if (filter !== '') {
      switch (filter) {
        case 'online':
          filteredStores.forEach((filteredStore) => {
            filteredStore.stores = filteredStore.stores.filter((store) => store.website);
          });
          break;
        case 'offline':
          filteredStores.forEach((filteredStore) => {
            filteredStore.stores = filteredStore.stores.filter((store) => store.address);
          });
          break;
        default:
          break;
      }
    }

    clear(storeView);

    if (isGlobalSelected) {
      initGoogleMap(stores);
    } else {
      initGoogleMap(filteredStores[0].stores);
    }

    filteredStores.forEach((store) => {
      if (store.stores.length <= 0) return;

      const storeHTML = document.createElement('div');

      storeHTML.insertAdjacentHTML(
        'beforeend',
        `
          <div class="flex items-center gap-2 sticky top-[var(--sticky-offset,0)] bg-primary-bg py-4">
            <img src="//cdn.shopify.com/static/images/flags/${store.country_code.toLowerCase()}.svg?width=32" width="32" height="24">
            <p>
              ${regionNames.of(store.country_code)}
              <span class="text-sm text-accent-1">${
                store.stores.length > 1
                  ? theme.strings.storeFinder.storesCount.replace(
                      '{{ count }}',
                      store.stores.length
                    )
                  : theme.strings.storeFinder.storeCount.replace('{{ count }}', store.stores.length)
              }</span>
            </p>
          </div>
        `
      );

      let storesHTML = '';
      store.stores.forEach((entry) => {
        const {
          company = '',
          address = '',
          zipcode = '',
          city = '',
          website = '',
          latitude = '',
        } = entry;
        storesHTML += `
          <li class="store-list-item rounded border border-accent-2-bg p-6" data-name=${company}  data-latitude=${latitude}>
              <h3 class="h5 min-h-[3.12rem] font-bold line-clamp-2">${company}</h3>
              <div class="flex justify-between">
                <a
                  href="https://maps.google.com?daddr=${address} ${zipcode} ${city}"
                  target="_blank"
                >
                  ${address}
                  <br>
                  ${zipcode} ${city}
                </a>
  
                <div class="grid grid-rows-2 items-center justify-center gap-2">
                  <div class="h-6 w-6">
                    <a
                      href="https://maps.google.com?daddr=${address} ${zipcode} ${city}"
                      target="_blank"
                      class="block text-accent-2"
                    >
                    ${theme.icons.locationPin}
                    </a>
                  </div>
                  <div class="h-6 w-6">
                  ${
                    website !== ''
                      ? `
                    <a
                      href="${website}"
                      target="_blank"
                      class="block text-accent-2"
                    >
                      ${theme.icons.arrowFromSquare}
                    </a>
                  `
                      : ''
                  }
                  </div>
                </div>
              </div>
            </li>
        `;
      });

      storeHTML.insertAdjacentHTML(
        'beforeend',
        `<ul class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">${storesHTML}</ul>`
      );
      storeView.insertAdjacentElement('beforeend', storeHTML);
    });

    if (storeView.childNodes.length <= 0) {
      storeView.insertAdjacentHTML(
        'beforeend',
        `<p>${theme.strings.storeFinder.noStoresFound}</p>`
      );
    }
  };

  const setFilter = (filterOption) => {
    filterButtons.forEach((filterButton) =>
      filterButton.classList.remove('store-finder__filter--active')
    );

    if (filterOption !== storeFilter) {
      storeFilter = filterOption;
    } else {
      storeFilter = '';
    }

    renderFilteredView({
      country: countryInput.value,
      searchTerms: cityTextInput.value,
      filter: storeFilter,
    });

    if (storeFilter === '') return;

    node
      .querySelector<HTMLElement>(`[data-filter="${filterOption}"]`)
      ?.classList.add('store-finder__filter--active');
  };

  const bindEventListeners = () => {
    countryInput.addEventListener('input', () => {
      renderFilteredView({
        country: countryInput.value,
        searchTerms: cityTextInput.value,
        filter: storeFilter,
      });
    });

    cityTextInput.addEventListener('input', () => {
      renderFilteredView({
        country: countryInput.value,
        searchTerms: cityTextInput.value,
        filter: storeFilter,
      });
    });

    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        setFilter(button.getAttribute('data-filter'));
      });
    });
  };

  const initializeFilters = () => {
    renderCountries();
    bindEventListeners();
  };

  initializeFilters();
};

export default Component;
