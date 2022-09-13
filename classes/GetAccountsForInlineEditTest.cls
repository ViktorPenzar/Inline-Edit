@isTest
private class GetAccountsForInlineEditTest {

    @TestSetup
    static void createAccounts() {
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < 10; i++) {
            accounts.add(new Account(Name='Test' + i));
        }
        insert accounts;
    }

    @isTest
    static void getAccounts_loadAccounts_accountsRecieved() {
        List<Account> newAccounts = [
            SELECT Name FROM Account
        ];

        Test.startTest();
        List<Account> returnedAccounts = GetAccountsForInlineEdit.getAccounts();
        Test.stopTest();

        System.assertEquals(newAccounts, returnedAccounts, 'Accounts were received');
        System.assert(returnedAccounts.size() == 10, 'Was expecting to find ten accounts');
    }

    @isTest
    static void getAccounts_checkNegativeReturn_emptyList() {
        List<Account> accounts = [
            SELECT Name FROM Account
        ];
        delete accounts;

        Test.startTest();
        List<Account> returnedAccounts = GetAccountsForInlineEdit.getAccounts();
        Test.stopTest();

        System.assert(returnedAccounts.size() == 0, 'Was expecting to find no accounts');
    }
}