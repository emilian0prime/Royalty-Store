const contractSource = `
  contract Royality =
    
    record design =
      { designerAddress: address,
        designUrl      : string,
        designerName   : string,
        designTips     : int }

    record trade =
      { royalityAddress: address,
        clientAddress  : address,
        clientEmail    : string,
        clientNumber   : string,
        itemName       : string,
        itemAmount     : int }
        
    record state =
      { designs      : map(int, design),
        designsLength: int,
        trades       : map(int, trade),
        tradesLength : int }
        
    entrypoint init() =
      { designs = {},
        designsLength = 0,
        trades = {},
        tradesLength = 0 }

    entrypoint get_designs_length() : int =
      state.designsLength

    entrypoint get_trades_length() : int =
      state.tradesLength
        
    stateful entrypoint upload_design(designUrl' : string, designerName' : string) =
      let design = { designerAddress = Call.caller, designUrl = designUrl', designerName = designerName', designTips = 0}
      let designIndex = get_designs_length() + 1
      put(state{ designs[designIndex] = design, designsLength = designIndex })

    stateful entrypoint order_product(clientEmail' : string, clientNumber' : string, itemName' : string, itemAmount' : int) =
      let trade = { royalityAddress = ak_2o5ZXFXU6uGNdLR2TzCBTSe7TCFfbtK8YAzMCd7zhosD9xymcq, clientAddress = Call.caller, clientEmail = clientEmail', clientNumber = clientNumber', itemName = itemName', itemAmount = itemAmount'}
      Chain.spend(trade.royalityAddress, Call.value)
      let tradeIndex = get_trades_length() + 1
      put(state{ trades[tradeIndex] = trade, tradesLength = tradeIndex })

    entrypoint get_design(designIndex : int) : design =
      switch(Map.lookup(designIndex, state.designs))
        None         => abort("Design not found")
        Some(design) => design

    entrypoint get_trade(tradeIndex : int) : trade =
      switch(Map.lookup(tradeIndex, state.trades))
        None        => abort("Trade not found")
        Some(trade) => trade
      
    stateful entrypoint tip_design(designIndex : int) =
      let design = get_design(designIndex)
      Chain.spend(design.designerAddress, Call.value)
      let updatedDesignTipCount = design.designTips + Call.value
      let updatedDesigns = state.designs{ [designIndex].designTips = updatedDesignTipCount }
      put(state{ designs = updatedDesigns })
`;

const contractAddress = 'ct_1AoDBXQBopjZcPHMPpnPpwoKi8KmW18HAcbQGseSTUfzfa1kq';
var client = null;
var contractInstance = null;
var designArray = [];
var designsLength = 0;

function renderDesigns() {
  designArray = designArray.sort((a, b) => b.designTips - a.designTips);
  let template = $('#template').html();
  Mustache.parse(template);
  let rendered = Mustache.render(template, {designArray});
  $('#designBody').html(rendered);
}

window.addEventListener('load', async () => {
  $("#loader").show();

  client = await Ae.Aepp();
  contractInstance = await client.getContractInstance(contractSource, {contractAddress});

  designsLength = (await contractInstance.methods.get_designs_length()).decodedResult;

  for (let i = 1; i <= designsLength; i++) {
    const design = (await contractInstance.methods.get_design(i)).decodedResult;

    designArray.push({
      designerName: design.designerName,
      designUrl: design.designUrl,
      designIndex: i,
      designTips: design.designTips / 1000000000000000000,
    })
  };

  renderDesigns();
  $("#loader").hide();
});


jQuery("#designBody").on("click", ".tipBtn", async function(event){
  $("#loader").show();

  let value = $(this).siblings('input').val(),
      designIndex = event.target.id,
      aevalue = value * 1000000000000000000;

  await contractInstance.methods.tip_design(designIndex, { amount: aevalue }).catch(function(error) {
    console.error(error)
  });

  const foundIndex = designArray.findIndex(design => design.designIndex == designIndex);

  designArray[foundIndex].designTips += parseInt(value, 10);

  renderDesigns();
  $("#loader").hide();
});