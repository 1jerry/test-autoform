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
    NDC: {type:String
        ,autoform: {omit: true}
    },
    trxDate: {type:Date },
    enteredOn: {type:Date, autoValue:default2now, optional: true
        ,autoform: {omit: true}
    },
    verifiedOn: {type:Date, optional:true
        ,autoform: {omit: true}
    },
    rx: { type: String },
    qty: {type:Number,min:1},
    curqty: {type:Number, optional:true},
    enteredBy: {type:String},
    verifiedBy: {type:String, optional:true}
}));

function fn_productsDefault() {return [
    {
        NDC:"11",
        desc:"Syhphis Nexum",
        lastQty:100
    },    {
        NDC:"12",
        desc:"Xano Charm Pro",
        lastQty:100
    },    {
        NDC:"13",
        desc:"Fixum Upum",
        lastQty:100
    },    {
        NDC:"14",
        desc:"Mayor Libre Plus",
        lastQty:100
    },    {
        NDC:"15",
        desc:"Weedus Smokumaxium",
        lastQty:100
    }
    ]}

function fn_trx_testdata() {return [
        {   trxDate: moment("10/01/2014 10:01").toDate()
            ,rx:"10010"
            ,qty:10
            ,curqty:0
            ,enteredBy:"Steve Smith"
            ,enteredOn: moment("10/01/2014 10:02").toDate()
            ,verifiedBy: "Mike Gilbert"
            ,verifiedOn: moment("10/01/2014 10:11").toDate()
        },{ trxDate: moment("10/01/2014 12:01").toDate()
            ,rx:"10012"
            ,qty:11
            ,curqty:0
            ,enteredBy:"Steve Smith"
            ,enteredOn: moment("10/01/2014 12:12").toDate()
            ,verifiedBy: "Mike Gilbert"
            ,verifiedOn: moment("10/01/2014 12:13").toDate()
        }
    ]}


if (Meteor.isClient) {
    Meteor.startup(function () {
        // will reset screen to no selected products if server restarts
        Session.set('selected_product',"")
        Session.set('current_name',"")
    });
    reset_form = function () {
        // sb global
        if($('#inputForm')) $('#inputForm').addClass('hidden');
        if($("#toggleAddForm"))$("#toggleAddForm").addClass('btn-primary');
//        AutoForm.resetForm("insertTrxForm")
    };
    Template.productList.products = function () {
        return products.find({}, {sort: {CDC: 1}})
    };
    //noinspection JSUnusedGlobalSymbols
    Template.trxList.helpers({
        trx: function() {
            var product = products.findOne({NDC: Session.get("selected_product")});
            if (product) {
                return transactions.find({NDC: product.NDC}, {sort: {enteredOn: -1}});
            } else {
                return []
            }
        },
        selected_item: function () {
            var item =  products.findOne({NDC:Session.get("selected_product")});
            if(item) item.curQty = Session.get('curQty');
            return item;
        }
    });
    Template.trxList.events({
        'click #toggleAddForm': function () {
            $('#inputForm').toggleClass('hidden');
            $("#toggleAddForm").toggleClass('btn-primary')
        }
    })
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
            return Session.equals("selected_product", this.NDC) ? "selected" : '';
        },
        curQty: function() {
            var trxs = transactions.find({NDC:this.NDC}) ;
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
            if (Session.get("selected_product") == this.NDC) {
                Session.set("selected_product", "");
                $("#transactions_section").slideUp(600);
            } else {
                Session.set("selected_product", this.NDC);
                Session.set('curQty', $('td:last',e.currentTarget)[0].innerText);
                if (0) {
                    console.log('this: ', this);
                    console.log('template.data: ', t.data);
                    console.log('e.currentTarget: ', e.currentTarget);
                    console.log('set from DOM: ', $('td:last', e.currentTarget)[0].innerText);
                }
                $("#transactions_section").slideUp(600);
                $("#transactions_section").slideDown(600);
                $('body').animate({scrollTop: $(document).height()})
            }
            reset_form();
        }
    });

    //noinspection JSUnusedLocalSymbols
    AutoForm.hooks({
        insertTrxForm: {
            before: {
                insert: function( doc, template) {
//                    console.info('default doc: ',doc);
                    doc.NDC = Session.get("selected_product") || "[missing]";
                    doc.curqty = Session.get('curQty') - doc.qty
                    mdate = moment(doc.trxDate)
                    doc.trxDate = mdate.add(mdate.zone(), 'm').toDate()  //adjust TZ
                    Session.set('current_name', doc.enteredBy);
//                    console.info('updated doc: ',doc);
                    return doc;
                }
            },
            after: {
                insert: function( error, result) {
                    if (error) {
                        console.log("Insert Error:", error);
                    } else {
                        Session.set('selected_product', "");
                        $("#transactions_section").slideUp(600);
                        reset_form();
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
                    trx_testdata[j]['NDC'] = productsDefault[i]['NDC']
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
