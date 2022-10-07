
(function(){
  /* Utility functions */
  
  var checkEl = function(selector, callback, timeOut) {
    if(document.querySelector(selector)){
      callback(document.querySelector(selector))
    }else if(timeOut > 0){
      timeOut -= 50;
      setTimeout(checkEl, 50, selector, callback, timeOut);
    }else {
      console.log('Element not found::', selector);
    }
  }

  var sendDataToAnalytics = function(obj) {
    fetch('https://postman-echo.com/post', {
      method: 'POST',
      body: JSON.stringify(obj)
    }).then(function(res){
      console.log('Succesfully sent to analytics')
    })
    .catch(function(error){
      console.error(error);
    });
  }

  /* ---- */

  /* Fetch saved state for count of clicks */
  var store, sortedPrices = [];
  try {
    store = JSON.parse(localStorage.getItem('productStore')) || {};
  }catch(error) {
    store = {};
  }

  var reorderByPrice = function(el) {

    el.classList.add('at-target');
    sortedPrices = [];
    var products = el.querySelectorAll('li.list-group-item');


    /* Sort the products according to the price */
    for (var i = 0; i < products.length; i++) {
      var price = products[i].querySelector('h6').textContent.replace('$', '').trim();
      sortedPrices.push(Number(price));
    }

    sortedPrices.sort();
    
    for (var i = 0; i < products.length; i++) {
      var price = products[i].querySelector('h6').textContent.replace('$', '').trim(),
      productName = (products[i].querySelector('.media-body h5').textContent || "").trim();
      
      var index = sortedPrices.indexOf(Number(price));
      products[i].style.order = index;
      products[i].setAttribute('data-order', index);

      /* Get the count of clicks from saved state and sort it last if clicks > 5 */
      if(store[productName]){
        var count = Number(store[productName]) || 0;
        if(count > 5) {
          products[i].classList.add('sort-last');
          products[i].style.order = index + sortedPrices.length;
        }
      }
    }
  }

  var callback = function(el){
    
    reorderByPrice(el);

    el.addEventListener('click', function(e){
      var target = e.target;
  
      if(target.tagName === 'BUTTON' && target.classList.contains('add-to-cart')) {
        var parent = target.closest('li.list-group-item'),
        productTitle = parent.querySelector('.media-body h5').textContent,
        price = parent.querySelector('.media-body > div > h6').textContent;
        
        /* Increment count of clicks in state */
        store[productTitle] = (Number(store[productTitle] || "") || 0) + 1;
  
        if(store[productTitle] > 5) {
          parent.classList.add('sort-last');
          parent.style.order = Number(parent.getAttribute('data-order')) + sortedPrices.length;
          console.log('sortedPrices', sortedPrices.length);
        }
  
        //Send data to analytics
        sendDataToAnalytics({
          'productTitle': productTitle,
          'productPrice': price,
          'addToCartCount': store[productTitle]
        });
  
        //Save the number of clicks locally
        localStorage.setItem('productStore', JSON.stringify(store));
      }
  
    });

  }

  document.body.insertAdjacentHTML('beforeend', '\
    <style>\
      ul.at-target {\
        border-radius: 0.25rem;\
        overflow: hidden;\
      }\
      ul.at-target > li.list-group-item {\
        margin-bottom: 0;\
      }\
      ul.at-target > li.list-group-item:first-child, ul.at-target > li.list-group-item:last-child {\
        border-top-left-radius: 0;\
        border-top-right-radius: 0;\
        border-bottom-left-radius: 0;\
        border-bottom-right-radius: 0;\
      }\
      @media (max-width: 400px) {\
        .btn.add-to-cart {\
          background-color: green;\
        }\
      }\
      @media (min-width: 401px) {\
        ul.at-target > li.list-group-item:not(.sort-last) {\
          order: 0 !important;\
        }\
      }\
    </style>\
  ')

  checkEl('ul.list-group', callback, 5000);
  
  
})()
