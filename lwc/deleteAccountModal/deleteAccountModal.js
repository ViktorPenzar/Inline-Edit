import { LightningElement, api} from "lwc";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';

export default class DeleteAccountModal extends LightningElement {

    closeModal = false;
    @api recordId;

    handleDelete() {
        deleteRecord(this.recordId)
        .then(() => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Account deleted',
                    variant: 'success'
                })
            ); 
            this.dispatchEvent(new CustomEvent('refresh'));
        })
        .catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error deleting record',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        });
    }

    handleCancel(event) {
        this.closeModal = event;
        this.dispatchEvent(new CustomEvent('close'));
    }
}