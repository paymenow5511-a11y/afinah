import {OUTLOOK_CACHE,OUTLOOK_PREFS,SCOPES,validClientId,graphPages,fetchSnapshot,readCache} from './outlook-data.mjs';

export class OutlookCalendar {
  constructor({onChange,getDay,storage=localStorage,fetcher=fetch,online=()=>navigator.onLine}){
    this.storage=storage;this.onChange=onChange;this.getDay=getDay;this.status='Outlook is not connected.';this.calendars=[];this.busy=false;this.epoch=0;
    this.fetcher=fetcher;this.online=online;
    try{this.prefs=JSON.parse(storage.getItem(OUTLOOK_PREFS)||'{}')||{};}catch{this.prefs={};}
    this.snapshot=readCache(storage);if(this.snapshot?.account!==this.prefs.account)this.snapshot=null;
  }
  changed(){this.onChange(this);}
  savePrefs(){this.storage.setItem(OUTLOOK_PREFS,JSON.stringify(this.prefs));}
  externalChange(){
    ++this.epoch;this.busy=false;
    try{this.prefs=JSON.parse(this.storage.getItem(OUTLOOK_PREFS)||'{}')||{};}catch{this.prefs={};}
    this.snapshot=readCache(this.storage);if(this.snapshot?.account!==this.prefs.account)this.snapshot=null;
    this.account=this.pca?.getAllAccounts().find(a=>a.homeAccountId===this.prefs.account)||null;
    if(!this.prefs.account){this.calendars=[];this.status='Outlook is disconnected.';}
    else this.status=this.account?'Outlook calendar updated in another tab.':'Showing a saved Outlook calendar copy. Reconnect to refresh.';
    this.changed();
  }
  async initialize(){
    try{
      if(!this.prefs.clientId&&this.online()){try{const r=await this.fetcher('/api/outlook-config',{cache:'no-store',signal:AbortSignal.timeout(5000)});const config=await r.json();if(validClientId(config.clientId))this.prefs.clientId=config.clientId;}catch{}}
      if(!validClientId(this.prefs.clientId)){this.status='One-time Microsoft setup is needed before Outlook can connect.';this.changed();return;}
      if(!this.online()){this.status='Offline. Showing your last saved Outlook appointments.';this.changed();return;}
      const {PublicClientApplication}=await import('./msal.generated.mjs');
      this.pca=new PublicClientApplication({auth:{clientId:this.prefs.clientId,authority:'https://login.microsoftonline.com/common',redirectUri:location.origin+'/',navigateToLoginRequestUrl:false},cache:{cacheLocation:'localStorage'},system:{loggerOptions:{piiLoggingEnabled:false,loggerCallback:()=>{}}}});
      await this.pca.initialize();
      const result=await this.pca.handleRedirectPromise();
      this.account=result?.account||this.pca.getAllAccounts().find(a=>a.homeAccountId===this.prefs.account)||null;
      if(this.account){
        this.pca.setActiveAccount(this.account);
        if(this.prefs.account!==this.account.homeAccountId){this.snapshot=null;this.storage.removeItem(OUTLOOK_CACHE);delete this.prefs.selected;}
        this.prefs.account=this.account.homeAccountId;this.savePrefs();await this.sync();
      }else{this.status='Sign in to Microsoft to connect Outlook.';this.changed();}
    }catch(error){this.status=this.message(error);this.changed();}
  }
  message(error){if(error.status)return error.message;const code=error.errorCode;if(code==='user_cancelled')return 'Microsoft sign-in was cancelled. You can connect again.';if(code==='interaction_required'||code==='consent_required'||code==='login_required'||error.name==='InteractionRequiredAuthError')return 'Please reconnect Outlook to renew Microsoft permission.';return 'Outlook could not connect. Check your connection and Microsoft app setup, then try again.';}
  async configure(clientId){
    if(!validClientId(clientId))throw Error('Enter the Microsoft Application (client) ID from the app registration.');
    if(this.prefs.clientId!==clientId){await this.disconnect();this.prefs={clientId};this.savePrefs();this.pca=null;}
    if(!this.pca)await this.initialize();
  }
  async connect(clientId){
    await this.configure(clientId);
    if(!this.pca)throw Error('Microsoft sign-in is not ready. Check your internet connection.');
    await this.pca.loginRedirect({scopes:SCOPES,prompt:'select_account'});
  }
  async disconnect(){
    ++this.epoch;
    if(this.pca)await this.pca.clearCache(this.account?{account:this.account}:undefined);
    this.account=null;this.snapshot=null;this.calendars=[];this.busy=false;
    this.storage.removeItem(OUTLOOK_CACHE);delete this.prefs.account;delete this.prefs.selected;this.savePrefs();
    this.status='Outlook disconnected. Saved appointments were removed from this device. Your Outlook calendar is unchanged.';this.changed();
  }
  async sync(selection=null){
    if(this.busy||!this.pca||!this.account)return;
    if(!this.online()){this.status='Offline. Showing your last saved Outlook appointments.';this.changed();return;}
    this.busy=true;const epoch=this.epoch,account=this.account;this.status='Refreshing Outlook appointments…';this.changed();
    try{
      const token=await this.pca.acquireTokenSilent({account,scopes:SCOPES});
      const calendars=await graphPages('me/calendars?$select=id,name,isDefaultCalendar',token.accessToken,this.fetcher);
      const previous=selection??this.prefs.selected;
      const selected=Array.isArray(previous)?previous.filter(id=>calendars.some(c=>c.id===id)):[(calendars.find(c=>c.isDefaultCalendar)||calendars[0])?.id].filter(Boolean);
      const snapshot=await fetchSnapshot(token.accessToken,calendars,selected,this.getDay(),this.fetcher);
      if(epoch!==this.epoch)return;
      snapshot.account=account.homeAccountId;
      this.storage.setItem(OUTLOOK_CACHE,JSON.stringify(snapshot));
      this.prefs.selected=selected;this.savePrefs();this.snapshot=snapshot;this.calendars=calendars;
      this.status=`Connected to Outlook · ${account.username||'Microsoft account'}.`;
    }catch(error){if(epoch===this.epoch)this.status=this.message(error);}
    finally{if(epoch===this.epoch){this.busy=false;this.changed();}}
  }
}
