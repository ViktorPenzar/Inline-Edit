import { LightningElement, wire } from 'lwc';
import getAccounts from '@salesforce/apex/GetAccountsForInlineEdit.getAccounts';
import { refreshApex } from '@salesforce/apex';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';
import RATING_FIELD from '@salesforce/schema/Account.RATING';
import { getPicklistValues, getObjectInfo } from 'lightning/uiObjectInfoApi';

export default class InlineEditTableHtml extends LightningElement {

    recordId;
    deleteAccountModal = false;
    data = [];
    backupData = [];
    draftValues = [];
    refreshTable;
    pickListOptions;
    disabled = false;

    showInlineEditName = false;
    showInlineEditRating = false;
    showSaveCancelButton = false;

    @wire(getAccounts)
    wired(result) {
        this.refreshTable = result;
        if(result.data) {
            let currentData = [], i=1;
            result.data.forEach((row) => {
                let rowData = {};
                rowData.Id = row.Id
                rowData.Name = row.Name;
                rowData.Rating = row.Rating;
                //rowData.rowNumber = i++;
                rowData.nameReadOnly = true;
                rowData.ratingReadOnly = true;
                rowData.nameCellColor = JSON.parse(JSON.stringify('slds-cell-edit slds-cell_action-mode slds-hint-parent'));
                rowData.ratingCellColor = JSON.parse(JSON.stringify('slds-cell-edit slds-cell_action-mode slds-hint-parent'));
                currentData.push(rowData);
            });
            this.data = currentData;
            console.log('Data 1111', JSON.stringify(this.data));
        }
    }

    @wire(getObjectInfo, { objectApiName: ACCOUNT_OBJECT })
    objectInfo;

    @wire(getPicklistValues, { recordTypeId: "$objectInfo.data.defaultRecordTypeId", fieldApiName: RATING_FIELD })
    wirePickList({ error, data }) {
        if (data) {
            this.pickListOptions = data.values;
        } else if (error) {
            console.log(error);
        }
    }

    handleNameAction(event){
        if(this.backupData.length === 0) {
            this.backupData = JSON.parse(JSON.stringify(this.data));
        }
        this.data[event.target.dataset.index].nameReadOnly = false;
        this.data = [...this.data];
        this.disabled = true;
    }

    handleRatingAction(event) {
        if(this.backupData.length === 0) {
            this.backupData = JSON.parse(JSON.stringify(this.data));
        }
        this.data[event.target.dataset.index].ratingReadOnly = false;
        this.data = [...this.data];
        this.disabled = true;
    }

    onNameBlur(event) {
        this.data[event.target.dataset.index].nameReadOnly = true;
        this.data = [...this.data];
        if(event.currentTarget.value.trim() != this.refreshTable.data[event.target.dataset.index].Name && event.currentTarget.value != undefined && event.currentTarget.value.trim() != '') {
            this.data[event.target.dataset.index].nameCellColor = 'slds-cell-edit slds-is-edited slds-cell_action-mode slds-hint-parent';
            this.disabled = true;
        }
        if(event.currentTarget.value.trim() == this.refreshTable.data[event.target.dataset.index].Name) {
            this.disabled = false;
        }
    }

    onRatingBlur(event) {
        this.data[event.target.dataset.index].ratingReadOnly = true;
        this.data = [...this.data];
        if(event.currentTarget.value == this.refreshTable.data[event.target.dataset.index].Rating) {
            this.disabled = false;
        }
    }

    onNameChange(event) {
        if(event.currentTarget.value != undefined && event.currentTarget.value.trim() != ''){ 
            this.showSaveCancelButton = true;
            this.draftValue = { Id: event.target.dataset.id, Name: event.target.value.trim()}
            this.draftValues.push(this.draftValue);
            this.data[event.target.dataset.index].Name = event.target.value.trim();
        }
    }

    onRatingChange(event) {
        this.showSaveCancelButton = true;
        if(event.currentTarget.value != undefined && event.currentTarget.value != ''){
            this.draftValue = { Rating: event.target.value, Id: event.target.dataset.id }
            this.draftValues.push(this.draftValue);
            this.data[event.target.dataset.index].Rating = event.target.value;
            this.data = [...this.data];
            this.data[event.target.dataset.index].ratingReadOnly = true;
            this.data = [...this.data];
        }
        if(event.currentTarget.value != this.refreshTable.data[event.target.dataset.index].Rating) {
            this.data[event.target.dataset.index].ratingCellColor = 'slds-cell-edit slds-is-edited slds-cell_action-mode slds-hint-parent';
        }
    }

    async handleSave() {
        const records = this.draftValues.slice().map((draftValue) => {
            const fields = Object.assign({}, draftValue);
            return { fields };
        });
        this.draftValues = [];
        this.backupData = [];
        try {
            const recordUpdatePromises = records.map((record) =>
                updateRecord(record)
            );
            await Promise.all(recordUpdatePromises);
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Account updated',
                    variant: 'success'
                })
            );
            this.showSaveCancelButton = false;
            await refreshApex(this.refreshTable);
            this.disabled = false;
        } catch (error) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error updating or reloading accounts',
                    message: error.body.message,
                    variant: 'error'
                })
            );
            this.showSaveCancelButton = false;
            await refreshApex(this.refreshTable);
            this.disabled = false;
        }
    }

    deleteAccount(event) {
        this.deleteAccountModal = true;
        this.recordId = event.target.dataset.id;
        if(this.showSaveCancelButton == true) {
            this.draftValues = [];
            this.showSaveCancelButton = false;
            this.disabled = false;
            this.data = this.backupData;
            this.backupData = [];
        }
    }

    haldleRefresh() {
        this.deleteAccountModal = false;
        return refreshApex(this.refreshTable);
    }

    handleCancel() {
        this.draftValues = [];
        this.showSaveCancelButton = false;
        this.disabled = false;
        this.data = this.backupData;
        this.backupData = [];
    }

    haldleClose() {
        this.deleteAccountModal = false;
        if(this.showSaveCancelButton == true) {
            this.draftValues = [];
            this.showSaveCancelButton = false;
            this.disabled = false;
            this.data = this.backupData;
            this.backupData = [];
        }
    }
}