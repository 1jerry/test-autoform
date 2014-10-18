test-autoform
=============

test for Meteor AutoForm

At line 99 of test.html there is an input form.  The current input form will set the defaults and clear after use, but will *not* reset the defaults.
If line 101 is un-commented and lines 102-110 (the \{{#autoForm block) are commented, then the form will set the defaults, but will **never clear** them.

```
 99:<template name="insertTrx">
100:  <div id=inputForm class=" form-inline">
101:    <!--{{> quickForm collection="transactions" id="insertTrxForm" type="insert"  label-class="col-md-2" buttonContent="Log This" fields="docno, qty, enteredBy, trxDate" doc=defaultDoc}}-->
102:    {{#autoForm collection="transactions" id="insertTrxForm" type="insert"}}
103:    <fieldset>
104:      {{> afQuickField name="docno" autofocus=""}}
105:      {{> afQuickField name="qty"}}
106:      {{> afQuickField name="enteredBy" value=current_name}}
107:      {{> afQuickField name="trxDate" value=current_day}}
108:      <button type="submit" class="btn btn-primary">Log This</button>
109:    </fieldset>
110:    {{/autoForm}}
111:  </div>
112:</template>
```
