import { LightningElement, track, wire } from 'lwc';
import getAccounts from '@salesforce/apex/GetAccountsForInlineEdit.getAccounts';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';
import RATING_FIELD from '@salesforce/schema/Account.Rating';
import { getPicklistValues, getObjectInfo } from 'lightning/uiObjectInfoApi';

const columns = [
    { label: 'Name', fieldName: 'Name', editable: true },
    { label: 'Rating', fieldName: 'Rating', type: 'picklistColumn', editable: false, typeAttributes: {
            placeholder: 'Choose Rating', options: { fieldName: 'pickListOptions' },
            value: { fieldName: 'Rating' },
            context: { fieldName: 'Id' }
        }
    },
    {label: 'Action', fieldName: 'delete', type: 'button', typeAttributes: {label: 'Delete', name: 'delete'}}
]

export default class InlineEditHtml22 extends LightningElement {

    columns = columns;
    recordId;
    deleteAccountModal = false;
    @track data = [];
    @track accountData;
    @track draftValues = [];
    lastSavedData = [];
    @track pickListOptions;

    @wire(getObjectInfo, { objectApiName: ACCOUNT_OBJECT })
    objectInfo;

    @wire(getPicklistValues, { recordTypeId: "$objectInfo.data.defaultRecordTypeId", fieldApiName: RATING_FIELD })
    wirePickList({ error, data }) {
        if (data) {
            this.pickListOptions = data.values;
        } else if (error) {
            console.log(error);
            this.showToast('Error', 'An Error Occured!!', 'error', 'dismissable');
        }
    }

    @wire(getAccounts, { pickList: '$pickListOptions' })
    accountData(result) {
        this.accountData = result;
        if (result.data) {
            this.data = JSON.parse(JSON.stringify(result.data));
            this.data.forEach(element => {
                element.pickListOptions = this.pickListOptions;
            })
            this.lastSavedData = JSON.parse(JSON.stringify(this.data));
        } else if (result.error) {
            this.data = undefined;
        }
    };

    updateDataValues(updateItem) {
        let copyData = JSON.parse(JSON.stringify(this.data));
        copyData.forEach(item => {
            if (item.Id === updateItem.Id) {
                for (let field in updateItem) {
                    item[field] = updateItem[field];
                }
            }
        });
        this.data = [...copyData];
    }

    updateDraftValues(updateItem) {
        let draftValueChanged = false;
        let copyDraftValues = [...this.draftValues];
        copyDraftValues.forEach(item => {
            if (item.Id === updateItem.Id) {
                for (let field in updateItem) {
                    item[field] = updateItem[field];
                }
                draftValueChanged = true;
            }
        });
        if (draftValueChanged) {
            this.draftValues = [...copyDraftValues];
        } else {
            this.draftValues = [...copyDraftValues, updateItem];
        }
    }

    picklistChanged(event) {
        event.stopPropagation();
        let dataRecieved = event.detail.data;
        let updatedItem = { Id: dataRecieved.context, Rating: dataRecieved.value };
        this.updateDraftValues(updatedItem);
        this.updateDataValues(updatedItem);
    }

    handleCellChange(event) {
        this.updateDraftValues(event.detail.draftValues[0]);
    }

    handleSave() {
        this.saveDraftValues = this.draftValues;
        const recordInputs = this.saveDraftValues.slice().map(draft => {
            const fields = Object.assign({}, draft);
            return { fields };
        });
        const promises = recordInputs.map(recordInput => updateRecord(recordInput));
        Promise.all(promises).then(result => {
            this.showToast('Success', 'Account Updated Successfully!', 'success', 'dismissable');
            this.draftValues = [];
            return refreshApex(this.accountData);
        }).catch(error => {
            console.log(error);
            this.showToast('Error', 'An Error Occured!!', 'error', 'dismissable');
        }).finally(() => {
            this.draftValues = [];
        });
    }

    handleCancel() {
        this.data = JSON.parse(JSON.stringify(this.lastSavedData));
        this.draftValues = [];
    }

    showToast(title, message, variant, mode) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: mode
        });
        this.dispatchEvent(event);
    }

    deleteAccount(event) {
        this.deleteAccountModal = true;
        this.recordId = event.detail.row.Id;
    }

    haldleRefresh() {
        this.deleteAccountModal = false;
        return refreshApex(this.accountData);
    }

    haldleClose() {
        this.deleteAccountModal = false;
    }
}