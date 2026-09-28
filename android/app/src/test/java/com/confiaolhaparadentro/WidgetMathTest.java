package com.confiaolhaparadentro;
import org.junit.Test;
import static org.junit.Assert.*;
import java.util.*;
public class WidgetMathTest {
 @Test public void calendarGraceDoesNotInventCompletions(){assertEquals(12,WidgetMath.current(12,"2026-09-28","2026-09-29"));assertEquals(12,WidgetMath.current(12,"2026-09-28","2026-09-30"));assertEquals(0,WidgetMath.current(12,"2026-09-28","2026-10-01"));assertEquals(0,WidgetMath.current(0,"","2026-09-28"));}
 @Test public void midnightAndDstUseRealLocalDay(){Calendar c=Calendar.getInstance(TimeZone.getTimeZone("Europe/Lisbon"));c.clear();c.set(2026,2,29,0,0,0);assertEquals(23*60,WidgetMath.remainingMinutes(c));c.clear();c.set(2026,9,25,0,0,0);assertEquals(25*60,WidgetMath.remainingMinutes(c));c.clear();c.set(2026,8,28,23,59,30);assertEquals(1,WidgetMath.remainingMinutes(c));assertTrue(WidgetMath.progress(c)>.999f);c.add(Calendar.SECOND,30);assertEquals(1440,WidgetMath.remainingMinutes(c));assertEquals(0,WidgetMath.progress(c),.00001f);}
}
