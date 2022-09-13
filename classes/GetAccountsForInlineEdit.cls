public with sharing class GetAccountsForInlineEdit {

    @AuraEnabled(cacheable=true)
    public static List<Account> getAccounts() {
        return [
            SELECT Id, Name, Rating 
            FROM Account 
            LIMIT 100
        ];
    }
}
