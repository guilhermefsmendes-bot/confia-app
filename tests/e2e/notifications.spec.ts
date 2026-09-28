import {test,expect} from '@playwright/test';
for(const [language,settings,title,reminder] of [['pt','Definições','Notificações','Lembrete diário'],['en','Settings','Notifications','Daily reminder'],['es','Configuración','Notificaciones','Recordatorio diario'],['fr','Paramètres','Notifications','Rappel quotidien']])test('notification settings are translated and native-only: '+language,async({page})=>{
 await page.route(/(firestore|identitytoolkit|securetoken)\.googleapis\.com/,r=>r.abort());
 await page.addInitScript(lang=>{localStorage.setItem('confia_language',lang);const d=new Date();const date=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');localStorage.setItem('confia_daily_checkin',JSON.stringify({date,mood:5,need:'well',completed:true}));},language);
 await page.goto('/');await page.getByRole('button',{name:settings,exact:true}).click();
 const area=page.getByRole('region',{name:title,exact:true});await expect(area).toBeVisible();await expect(area.getByRole('switch',{name:reminder,exact:true})).toBeDisabled();
 await expect(area.getByRole('switch',{name:reminder,exact:true})).not.toBeChecked();expect(await area.innerText()).not.toContain('notifications.');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const buttons=area.getByRole('button').filter({has:page.locator('span')});await buttons.first().click();const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();expect(await dialog.innerText()).not.toMatch(/noticeHelp\./);await expect(dialog.getByRole('list')).toHaveCount(0);await dialog.getByRole('button').first().click();await expect(dialog).not.toBeVisible();
});
