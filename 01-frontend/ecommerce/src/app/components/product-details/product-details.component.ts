import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router } from '@angular/router';
import { Product } from 'src/app/common/product';
import { ProductService } from 'src/app/services/product.service';
import {CartService} from "../../services/cart.service";
import {CartItem} from "../../common/cart-item";

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css']
})
export class ProductDetailsComponent implements OnInit {

  products: Product = new Product();

  constructor(private cartService: CartService,private productService: ProductService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(()=>{this.handleProductDetails();
    })

  }

  private handleProductDetails() {
    const theProductId:number = +this.route.snapshot.paramMap.get('id');

    this.productService.getProduct(theProductId).subscribe(data => {this.products = data})

  }


  addToCart() {
    const theCartItem = new CartItem(this.products)
    this.cartService.addToCart(theCartItem)
  }
}
