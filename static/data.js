"use strict";
// this file contains all data that could change in the application. having such data eg list of meter manufacturers
// enables us to separate logic from the data hence when a change occurs, we dont edit the html file but rather this
// file

var APP_DATA = {
    distributors:{
        class:'distributors',
        data:['UMEME'],
    },
    
    manufacturers:{
        class:'manufacturers',
        data:['Conlog'],
    },

    modals:{
        class:'modals',
        data:['BEC 44'],
    },

    ct_rations:{
        class:'ct_rations',
        data:['RAC/A1'],
    },
    
    vt_rations:{
        class:'vt_rations',
        data:['VAT/A2'],
    },

    connection_modes:{
        class:'connection_modes',
        data:['DIRECT'],
    },

    accuracy_classes:{
        class:'accuracy_classes',
        data:['2.0'],
    },

    rated_voltages:{
        class:'rated_voltages',
        data:['240'],
    },

    rated_currents:{
        class:'rated_currents',
        data:['5'],
    },

    max_currents:{
        class:'max_currents',
        data:['100','200'],
    },

    districts:{
        class:'districts',
        data:[
          'Abim','Adjumani','Agago','Alebtong','Amolatar','Amudat','Amuria','Amuru','Apac','Arua','Budaka','Bududa',
          'Bugiri','Bugweri','Buhweju','Buikwe','Bukedea','Bukomansimbi','Bukwa','Bulambuli','Buliisa','Bundibugyo',
          'Bunyangabu','Bushenyi','Busia','Butaleja','Butambala','Butebo','Buvuma','Buyende','Dokolo','Gomba',
          'Gulu','Hoima','Ibanda','Iganga','Isingiro','Jinja','Kaabong','Kabale','Kabarole','Kaberamaido','Kagadi',
          'Kakumiro','Kalangala','Kaliro','Kalungu','Kampala','Kamuli','Kamwenge','Kanungu','Kapchorwa',
          'Kapelebyong','Karenga','Kasanda','Kasese','Katakwi','Kayunga','Kazo','Kibaale','Kiboga','Kibuku',
          'Kibuube','Kiruhura','Kiryandongo','Kisoro','Kitagwenda','Kitgum','Koboko','Kole','Kotido','Kumi',
          'Kwania','Kween','Kyankwanzi','Kyegegwa','Kyenjojo','Kyotera','Lamwo','Lira','Lusot','Luuka',
          'Luweero','Lwengo','Lyantonde','Madi-Okollo','Manafwa','Maracha','Masaka','Masindi','Mayuge','Mbale',
          'Mbarara','Mitooma','Mityana','Moroto','Moyo','Mpigi','Mubende','Mukono','Nabilatuk','Nakapiripirit',
          'Nakaseke','Nakasongola','Namayingo','Namisindwa','Namutumba','Napak','Nebbi','Ngora','Ntoroko','Ntungamo',
          'Nwoya','Obongi','Omoro','Otuke','Oyam','Pader','Pakwach','Pallisa','Rakai','Rubanda','Rubirizi','Rukiga',
          'Rukungiri','Rwampara','Serere','Sheema','Sironko','Soroti','Ssembabule','Tororo','Wakiso','Yumbe','Zombo' 
        ],
    },
};
