products = new Mongo.Collection("products");
transactions = new Mongo.Collection("transactions");
//SimpleSchema.debug = true;

function default2now() {
    //  timestamp for Schema
    if (this.isInsert) {
        return new Date;
    } else {
        this.unset();
    }
}
transactions.attachSchema(new SimpleSchema({
    prodID: {type:String
        ,autoform: {omit: true}
    },
    trxDate: {type:Date },
    enteredOn: {type:Date, autoValue:default2now, optional: true
        ,autoform: {omit: true}
    },
    docno: { type: String },
    qty: {type:Number,min:1},
    curqty: {type:Number, optional:true},
    enteredBy: {type:String}
}));

function fn_productsDefault() {return [
    {
        prodID:"11",
        desc:"Thing A",
        lastQty:100
    },    {
        prodID:"12",
        desc:"Thing B",
        lastQty:100
    },    {
        prodID:"13",
        desc:"Widget",
        lastQty:100
    },    {
        prodID:"14",
        desc:"Spam, spam, spam",
        lastQty:100
    },    {
        prodID:"15",
        desc:"The unnamed",
        lastQty:100
    }
    ]}

function fn_trx_testdata() {return [
        {   trxDate: moment("10/01/2014 10:01").toDate()
            ,docno:"10010"
            ,qty:10
            ,curqty:0
            ,enteredBy:"Steve Smith"
            ,enteredOn: moment("10/01/2014 10:02").toDate()
        },{ trxDate: moment("10/01/2014 12:01").toDate()
            ,docno:"10012"
            ,qty:11
            ,curqty:0
            ,enteredBy:"Steve Smith"
            ,enteredOn: moment("10/01/2014 12:12").toDate()
        }
    ]}


if (Meteor.isClient) {
    Meteor.startup(function () {
        // will reset screen to no selected products if server restarts
        Session.set('selected_product',"")
        Session.set('current_name',"")
    });

    Template.productList.products = function () {
        return products.find({}, {sort: {CDC: 1}})
    };
    //noinspection JSUnusedGlobalSymbols
    Template.trxList.helpers({
        trx: function() {
            var product = products.findOne({prodID: Session.get("selected_product")});
            if (product) {
                return transactions.find({prodID: product.prodID}, {sort: {enteredOn: -1}});
            } else {
                return []
            }
        },
        selected_item: function () {
            var item =  products.findOne({prodID:Session.get("selected_product")});
            if(item) item.curQty = Session.get('curQty');
            return item;
        }
    });
    //noinspection JSUnusedGlobalSymbols
    Template.insertTrx.helpers({
        current_name: function() {
            return Session.get('current_name')
        },
        current_day: function() {
            return moment().format("YYYY-MM-DD")
        },
        defaultDoc: function() {
            return {
                trxDate: moment().format("YYYY-MM-DD")
                , enteredBy:Session.get('current_name')
            }
        }
    })

    //noinspection JSUnusedGlobalSymbols
    Template.productRow.helpers({
        selected: function () {
            return Session.equals("selected_product", this.prodID) ? "selected" : '';
        },
        curQty: function() {
            var trxs = transactions.find({prodID:this.prodID}) ;
            var changes = _.reduce(trxs.fetch(), function(o,n){ return o + n.qty;},0);
            return this.lastQty - changes
        }
    });
    //noinspection JSUnusedGlobalSymbols
    Template.trxRow.helpers({
        formatted_trxDate: function() {
            return moment.utc(trxDate).format("LL")
        }
    })

    Template.productList.events({
        'click tr': function (e,t) {
            if (Session.get("selected_product") == this.prodID) {
                Session.set("selected_product", "");
            } else {
                Session.set("selected_product", this.prodID);
                Session.set('curQty', $('td:last',e.currentTarget)[0].innerText);
                console.log('template data = ', t.data)
            }
        }
    });

    //noinspection JSUnusedLocalSymbols
    AutoForm.hooks({
        insertTrxForm: {
            before: {
                insert: function( doc, template) {
                    doc.prodID = Session.get("selected_product") || "[missing]";
                    doc.curqty = Session.get('curQty') - doc.qty
                    mdate = moment(doc.trxDate)
                    doc.trxDate = mdate.add(mdate.zone(), 'm').toDate()  //adjust TZ
                    Session.set('current_name', doc.enteredBy);
                    return doc;
                }
            },
            after: {
                insert: function( error, result) {
                    if (error) {
                        console.log("Insert Error:", error);
                    } else {
                        console.log("record added:", result);
                    }

                }
            }

        }
    })
}

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
    Meteor.startup(function () {
        var productsDefault = fn_productsDefault();
        if (products.find().count() === 0 ) {
            for (var i1 = 0; i1< productsDefault.length; i1++)
                products.insert(productsDefault[i1])
        }
        if (transactions.find().count() === 0 ) {
            process.stdout.write("Reloading transactions...");
            var trx_testdata = fn_trx_testdata()
            for (var i = 0; i< productsDefault.length; i++) {
                var wqty = productsDefault[i].lastQty
                for (var j = 0; j< trx_testdata.length; j++) {
                    trx_testdata[j]['company'] = '';
                    trx_testdata[j]['branch'] = '';
                    trx_testdata[j]['prodID'] = productsDefault[i]['prodID']
                    trx_testdata[j]['qty'] =  qty = Math.max(1,Math.floor(Math.random()*10))
                    wqty -= qty;
                    trx_testdata[j].curqty = wqty;
                    transactions.insert(trx_testdata[j])
                }
            }
            process.stdout.write("\n");
        }
    });
}
