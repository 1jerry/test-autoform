test-autoform
=============

test for Meteor AutoForm

At line 99 of test.html there is an input form.  The current input form will set the defaults and clear after use, but will *not* reset the defaults.
If line 101 is un-commented and lines 102-110 (the \{{#autoForm block) are commented, then the form will set the defaults, but **never clear**.

> <template name="insertTrx">
  <div id=inputForm class=" form-inline">
    <!--{{> quickForm collection="transactions" id="insertTrxForm" type="insert"  label-class="col-md-2" buttonContent="Log This" fields="docno, qty, enteredBy, trxDate" doc=defaultDoc}}-->
    {{#autoForm collection="transactions" id="insertTrxForm" type="insert"}}
    <fieldset>
      {{> afQuickField name="docno" autofocus=""}}
      {{> afQuickField name="qty"}}
      {{> afQuickField name="enteredBy" value=current_name}}
      {{> afQuickField name="trxDate" value=current_day}}
      <button type="submit" class="btn btn-primary">Log This</button>
    </fieldset>
    {{/autoForm}}
  </div>
</template>
