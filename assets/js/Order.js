//Contract for ordering products on Royalty Store//
const contractSource = `
  contract Order =
  
    record product =
      { creatorAddress : address,
        email            : string,
        number      : int,
        dAddress           : string,
        buyCount      : int }
        
    record state =
      { products      : map(int, product),
        productsLength : int }
        
    entrypoint init() =
      { products = {},
        productsLength = 0 }
        
    entrypoint getProduct(index : int) : product =
      switch(Map.lookup(index, state.products))
        None    => abort("There was no product with this index ordered.")
        Some(x) => x
        
    stateful entrypoint orderProduct(email' : string, number' : int, dAddress' : string) =
      let product = { creatorAddress = Call.caller, email = email', number = number', dAddress = dAddress', buyCount = 0}
      let index = getProductsLength() + 1
      put(state{ products[index] = product, productsLength = index })
      
    entrypoint getProductsLength() : int =
      state.productsLength
      
    stateful entrypoint buyProduct(index : int) =
      let product = getProduct(index)
      Chain.spend(product.creatorAddress, Call.value)
      let updatedbuyCount = product.buyCount + Call.value
      let updatedProducts = state.products{ [index].buyCount = updatedbuyCount }
      put(state{ products = updatedProducts })
`;

const contractAddress = 'ct_24wgJTm2QR8qkzD6QgdzTaHVenYSma6ECtCLgwEsVHxeNgfiiJ';

var client = null;

var productArray = [];

var productsLength = 0;

function renderProducts() {

  productArray = productArray.sort(function(a,b){return b.buys-a.buys})

  let template = $('#template').html();

  Mustache.parse(template);

  let rendered = Mustache.render(template, {productArray});

  $('#productBody').html(rendered);
}


async function callStatic(func, args) {

  const contract = await client.getContractInstance(contractSource, {contractAddress});

  const calledGet = await contract.call(func, args, {callStatic: true}).catch(e => console.error(e));

  const decodedGet = await calledGet.decode().catch(e => console.error(e));

  return decodedGet;
}


async function contractCall(func, args, value) {
  const contract = await client.getContractInstance(contractSource, {contractAddress});

  const calledSet = await contract.call(func, args, {amount: value}).catch(e => console.error(e));

  return calledSet;
}


window.addEventListener('load', async () => {

  $("#loader").show();


  client = await Ae.Aepp();


  productsLength = await callStatic('getProductsLength', []);


  for (let i = 1; i <= ProductsLength; i++) {


    const product = await callStatic('getProduct', [i]);


    productArray.push({
      creatorName: product.name,
      productUrl: product.url,
      index: i,
      buys: product.buyCount,
    })
  }


  renderProducts();


  $("#loader").hide();
});


jQuery("#productBody").on("click", ".buyBtn", async function(event){
  $("#loader").show();

  let value = $(this).siblings('input').val(),
      index = event.target.id;


      await contractCall('buyProduct', [index], 10000000000000000000);


  const foundIndex = productArray.findIndex(product => product.index == event.target.id);

  productArray[foundIndex].buys += parseInt(value, 10);

  renderProducts();
  $("#loader").hide();
});


$('#orderBtn').click(async function(){
  $("#loader").show();

  const email = ($('#emailA').val()),
        number = ($('#phoneNo').val());
        dAddress = ($('#Address').val());

  await contractCall('orderProduct', [email, number, dAddress], 0);

  productArray.push({
    emailAddress: email,
    phoneNumber: number,
    deliveryAddress: dAddress,
    index: productArray.length+1,
    buys: 0,
  })

  renderProducts();
  $("#loader").hide();
});



